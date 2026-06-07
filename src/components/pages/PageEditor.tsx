'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useTabs } from '@/lib/context/TabContext';
import { getPage, updatePageContent, subscribeToPage } from '@/lib/firebase/firestore';
import { PageHeader } from '@/components/pages/PageHeader';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { ShareModal } from '@/components/pages/ShareModal';
import { Spinner } from '@/components/ui/Spinner';
import type { Page } from '@/lib/types';
import { JSONContent } from '@tiptap/react';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PageEditorProps {
  pageId: string;
}

export function PageEditor({ pageId }: PageEditorProps) {
  const { user } = useAuth();
  const { updateTabMeta, markDirty } = useTabs();
  
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    async function fetchPage() {
      setLoading(true);
      try {
        const p = await getPage(pageId);
        if (!isMounted) return;
        if (!p) {
          toast.error('Page not found');
          return;
        }
        setPage(p);
        updateTabMeta(pageId, { title: p.title, icon: p.icon });
      } catch (e) {
        if (isMounted) toast.error('Failed to load page');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPage();
    return () => { isMounted = false; };
  }, [pageId, updateTabMeta]);

  // Real-time sync via onSnapshot
  useEffect(() => {
    if (!pageId) return;

    const unsubscribe = subscribeToPage(pageId, (updatedPage) => {
      if (!updatedPage) return;
      
      setPage((prev) => {
        if (!prev) return updatedPage;
        // If we made the update, keep our local content to avoid clearing editor history
        if (updatedPage.updatedBy === user?.uid) {
          return { ...updatedPage, content: prev.content };
        }
        return updatedPage;
      });
      // Also update tab meta if changed remotely
      updateTabMeta(pageId, { title: updatedPage.title, icon: updatedPage.icon });
    });

    return () => unsubscribe();
  }, [pageId, user?.uid, updateTabMeta]);

  const handleContentUpdate = useCallback(
    (content: JSONContent) => {
      if (!user) return;
      
      // Mark tab as dirty
      markDirty(pageId, true);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updatePageContent(pageId, content, user.uid);
          markDirty(pageId, false);
        } catch {
          toast.error('Failed to save');
        }
      }, 1500);
    },
    [pageId, user, markDirty]
  );

  const handlePageUpdate = (updates: Partial<Page>) => {
    setPage((prev) => (prev ? { ...prev, ...updates } : prev));
    if (updates.title !== undefined || updates.icon !== undefined) {
      updateTabMeta(pageId, { 
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.icon !== undefined && { icon: updates.icon })
      });
    }
  };

  if (loading || !page) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full">
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2rem clamp(2rem, 5vw, 4rem)' }}>
        {/* Share button — floating top-right */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <PageHeader page={page} onUpdate={handlePageUpdate} />
        <TiptapEditor
          content={page.content}
          onUpdate={handleContentUpdate}
        />

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          page={page}
          onUpdate={handlePageUpdate}
        />
      </div>
    </div>
  );
}
