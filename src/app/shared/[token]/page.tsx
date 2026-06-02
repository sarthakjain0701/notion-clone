'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { getPageByShareToken, updatePageContent, subscribeToPage } from '@/lib/firebase/firestore';
import { PageHeader } from '@/components/pages/PageHeader';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import type { Page } from '@/lib/types';
import { JSONContent } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

export default function SharedPageView() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/shared/${token}`);
    }
  }, [user, authLoading, router, token]);

  // Fetch the shared page by token
  useEffect(() => {
    if (!user) return;

    async function fetchSharedPage() {
      setLoading(true);
      const p = await getPageByShareToken(token);
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPage(p);
      lastSavedRef.current = JSON.stringify(p.content);
      setLoading(false);
    }
    fetchSharedPage();
  }, [token, user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!page) return;

    const unsubscribe = subscribeToPage(page.id, (updatedPage) => {
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
  }, [page?.id, user?.uid]);

  const handleContentUpdate = useCallback(
    (content: JSONContent) => {
      if (!user || !page) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updatePageContent(page.id, content, user.uid);
        } catch {
          toast.error('Failed to save');
        }
      }, 1500);
    },
    [page?.id, user]
  );

  const handlePageUpdate = (updates: Partial<Page>) => {
    setPage((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (authLoading || loading) {
    return <FullPageSpinner />;
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--bg-primary)]">
        <div className="text-6xl">🔗</div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Page not found</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          This link may have expired or the page is no longer shared.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="h-screen overflow-y-auto bg-[var(--bg-primary)]">
      {/* Shared page banner */}
      <div className={cn(
        "sticky top-0 z-20 flex items-center justify-center gap-2 px-4 py-2 text-white text-sm shadow-sm",
        page.sharePermission === 'edit' ? "bg-[var(--accent-primary)]" : "bg-[var(--text-secondary)]"
      )}>
        <span>{page.sharePermission === 'edit' ? '🔗' : '👁️'}</span>
        <span>
          You are viewing a shared page 
          {page.sharePermission === 'view' && ' (View Only)'}
        </span>
        <span className="mx-2 opacity-50">•</span>
        <button
          onClick={() => router.push('/dashboard')}
          className="underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          Go to your workspace
        </button>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-8">
        <PageHeader page={page} onUpdate={handlePageUpdate} />
        <TiptapEditor
          content={page.content}
          onUpdate={handleContentUpdate}
          editable={page.sharePermission === 'edit'}
        />
      </div>
    </div>
  );
}
