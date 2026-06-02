'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { getFavoritePages } from '@/lib/firebase/firestore';
import { PageCard } from '@/components/pages/PageCard';
import { Spinner } from '@/components/ui/Spinner';
import { Star } from 'lucide-react';
import type { Page } from '@/lib/types';

export default function FavoritesPage() {
  const { workspace } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    getFavoritePages(workspace.id).then((p) => {
      setPages(p);
      setLoading(false);
    });
  }, [workspace]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">⭐ Favorites</h1>
        {pages.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-default)] rounded-xl">
            <Star className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-tertiary)]">No favorite pages yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pages.map((page) => <PageCard key={page.id} page={page} />)}
          </div>
        )}
      </div>
    </div>
  );
}
