'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { getPage, updatePageContent, subscribeToPage } from '@/lib/firebase/firestore';
import { PageHeader } from '@/components/pages/PageHeader';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { ShareModal } from '@/components/pages/ShareModal';
import { Spinner } from '@/components/ui/Spinner';
import type { Page } from '@/lib/types';
import { JSONContent } from '@tiptap/react';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pageId = params.id as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Initial fetch
  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      const p = await getPage(pageId);
      if (!p) {
        toast.error('Page not found');
        router.push('/dashboard');
        return;
      }
      setPage(p);
      lastSavedRef.current = JSON.stringify(p.content);
      setLoading(false);
    }
    fetchPage();
  }, [pageId, router]);

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
    });

    return () => unsubscribe();
  }, [pageId, user?.uid]);

  const handleContentUpdate = useCallback(
    (content: JSONContent) => {
      if (!user) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updatePageContent(pageId, content, user.uid);
        } catch {
          toast.error('Failed to save');
        }
      }, 1500);
    },
    [pageId, user]
  );

  const handlePageUpdate = (updates: Partial<Page>) => {
    setPage((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (loading || !page) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[var(--editor-max-width)] mx-auto px-6 py-8">
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
