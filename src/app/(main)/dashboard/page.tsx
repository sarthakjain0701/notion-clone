'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { subscribeToWorkspacePages, createPage } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { FileText, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

function DocCard({ page }: { page: Page }) {
  return (
    <Link
      href={`/page/${page.id}`}
      className="group flex flex-col w-[160px] h-[210px] rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Tall Preview area */}
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
        <span className="text-5xl opacity-80 group-hover:opacity-100 transition-opacity">
          {page.icon || '📄'}
        </span>
      </div>

      {/* Info footer */}
      <div className="h-[52px] px-3 py-2 flex flex-col justify-center bg-[var(--bg-primary)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
          {page.title || 'Untitled document'}
        </h3>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-3.5 h-3.5 bg-blue-500 rounded-sm flex items-center justify-center flex-shrink-0">
              <FileText className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)] truncate">
              Opened {formatRelativeTime(page.updatedAt)}
            </span>
          </div>
          <button 
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function BlankTemplateCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col gap-2 w-[160px]">
      <button
        onClick={onClick}
        className="group w-[160px] h-[210px] rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer"
      >
        {/* Multicolored Plus Icon to mimic Google Docs */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-x-0 top-1/2 -mt-0.5 h-1 bg-red-500" />
          <div className="absolute inset-y-0 left-1/2 -ml-0.5 w-1 bg-blue-500" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1/2 bg-green-500" />
          <div className="absolute top-1/2 right-1/2 w-1/2 h-1 bg-yellow-400" />
        </div>
      </button>
      <span className="text-sm font-medium text-[var(--text-primary)] px-1">
        Blank document
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, workspace } = useAuth();
  const router = useRouter();
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  // Use real-time subscription to avoid composite index errors and infinite loading
  useEffect(() => {
    if (!workspace) return;
    
    setLoading(true);
    const unsubscribe = subscribeToWorkspacePages(workspace.id, (pages) => {
      // Sort locally by updatedAt descending
      const sorted = [...pages].sort((a, b) => 
        (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)
      );
      setRecentPages(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspace]);

  const handleNewPage = async () => {
    if (!workspace || !user) return;
    try {
      const page = await createPage(workspace.id, user.uid, null, 'Untitled document');
      router.push(`/page/${page.id}`);
    } catch {
      toast.error('Failed to create document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">
      {/* Top Section: Start a new document (Light gray background in light mode) */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
        <div className="max-w-[1000px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              Start a new document
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            <BlankTemplateCard onClick={handleNewPage} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent documents */}
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Recent documents
          </h2>
        </div>

        {recentPages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">No documents yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {recentPages.map((page) => (
              <DocCard key={page.id} page={page} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
