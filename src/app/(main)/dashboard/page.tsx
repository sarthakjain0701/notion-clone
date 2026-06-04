'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { getRecentPages, getFavoritePages, createPage } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getGreeting } from '@/lib/utils/helpers';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { Plus, FileText, Star, Clock, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

function DocCard({ page }: { page: Page }) {
  return (
    <Link
      href={`/page/${page.id}`}
      className="group block rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Preview area */}
      <div
        className="h-32 flex items-center justify-center border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <span className="text-4xl">{page.icon || '📄'}</span>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {page.title || 'Untitled'}
        </h3>
        <div className="flex items-center gap-1.5 mt-1.5">
          <FileText className="w-3 h-3 text-[var(--text-tertiary)]" />
          <span className="text-xs text-[var(--text-tertiary)]">
            Edited {formatRelativeTime(page.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function NewDocCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group block rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all duration-200 overflow-hidden cursor-pointer w-full"
    >
      <div
        className="h-32 flex items-center justify-center"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--accent-primary)] text-white group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6" />
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Blank document
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Create a new page
        </p>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { user, workspace } = useAuth();
  const router = useRouter();
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [favoritePages, setFavoritePages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    async function fetchData() {
      const [recent, favorites] = await Promise.all([
        getRecentPages(workspace!.id, 12),
        getFavoritePages(workspace!.id),
      ]);
      setRecentPages(recent);
      setFavoritePages(favorites);
      setLoading(false);
    }
    fetchData();
  }, [workspace]);

  const handleNewPage = async () => {
    if (!workspace || !user) return;
    try {
      const page = await createPage(workspace.id, user.uid, null, 'Untitled');
      router.push(`/page/${page.id}`);
    } catch {
      toast.error('Failed to create page');
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
    <div className="h-full overflow-y-auto">
      {/* Hero section with gradient background */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
          padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 4rem)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ marginBottom: '6px' }}>
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[var(--text-secondary)]">
            What would you like to work on today?
          </p>

          {/* New document templates row */}
          <div
            className="grid gap-4 mt-8"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
          >
            <NewDocCard onClick={handleNewPage} />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
        }}
      >
        {/* Favorites section */}
        {favoritePages.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Favorites
              </h2>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
            >
              {favoritePages.map((page) => (
                <DocCard key={page.id} page={page} />
              ))}
            </div>
          </section>
        )}

        {/* Recent documents */}
        <section>
          <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
            <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Recent Documents
            </h2>
          </div>
          {recentPages.length === 0 ? (
            <div
              className="text-center border border-dashed border-[var(--border-default)] rounded-xl"
              style={{ padding: '3rem 1.5rem' }}
            >
              <FileText className="w-12 h-12 text-[var(--text-tertiary)] mx-auto" style={{ marginBottom: '12px' }} />
              <p className="text-[var(--text-tertiary)] text-sm">
                No pages yet. Create your first document!
              </p>
              <Button
                onClick={handleNewPage}
                icon={<Plus className="w-4 h-4" />}
                style={{ marginTop: '16px' }}
              >
                Create a page
              </Button>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
            >
              {recentPages.map((page) => (
                <DocCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
