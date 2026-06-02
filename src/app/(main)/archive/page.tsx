'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { getArchivedPages, restorePage, deletePage } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ArchivePage() {
  const { workspace } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    if (!workspace) return;
    const p = await getArchivedPages(workspace.id);
    setPages(p);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, [workspace]);

  const handleRestore = async (pageId: string) => {
    try {
      await restorePage(pageId);
      toast.success('Page restored');
      fetchPages();
    } catch { toast.error('Failed to restore'); }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Permanently delete this page?')) return;
    try {
      await deletePage(pageId);
      toast.success('Page permanently deleted');
      fetchPages();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">🗃️ Archive</h1>
        {pages.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-default)] rounded-xl">
            <Archive className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-tertiary)]">No archived pages</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{page.icon || '📄'}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{page.title || 'Untitled'}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Archived {formatRelativeTime(page.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleRestore(page.id)} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                    Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)} icon={<Trash2 className="w-3.5 h-3.5" />}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
