'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { getPage, updatePageContent } from '@/lib/firebase/firestore';
import { PageHeader } from '@/components/pages/PageHeader';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Spinner } from '@/components/ui/Spinner';
import type { Page } from '@/lib/types';
import { JSONContent } from '@tiptap/react';
import toast from 'react-hot-toast';

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pageId = params.id as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setLoading(false);
    }
    fetchPage();
  }, [pageId, router]);

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
        <PageHeader page={page} onUpdate={handlePageUpdate} />
        <TiptapEditor
          content={page.content}
          onUpdate={handleContentUpdate}
        />
      </div>
    </div>
  );
}
