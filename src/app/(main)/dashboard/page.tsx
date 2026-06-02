'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { getRecentPages, getFavoritePages, createPage } from '@/lib/firebase/firestore';
import { PageCard } from '@/components/pages/PageCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getGreeting } from '@/lib/utils/helpers';
import { Plus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

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
        getRecentPages(workspace!.id, 8),
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
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[var(--text-secondary)]">
            What would you like to work on today?
          </p>
        </div>

        {/* Quick Action */}
        <Button onClick={handleNewPage} icon={<Plus className="w-4 h-4" />} className="mb-10">
          New Page
        </Button>

        {/* Favorites */}
        {favoritePages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              ⭐ Favorites
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {favoritePages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Pages */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            🕐 Recently Edited
          </h2>
          {recentPages.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-default)] rounded-xl">
              <FileText className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-tertiary)]">No pages yet. Create your first page!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recentPages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
