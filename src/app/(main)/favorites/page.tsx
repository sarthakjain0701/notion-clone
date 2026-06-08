'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useTabs } from '@/lib/context/TabContext';
import { subscribeToFavoritePages, toggleFavorite } from '@/lib/firebase/firestore';
import { Spinner } from '@/components/ui/Spinner';
import { Star, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

/* ── Favorite Document Card ─────────────────────────── */
function FavoriteDocCard({
  page,
  onUnfavorite,
}: {
  page: Page;
  onUnfavorite: () => void;
}) {
  const { openTab } = useTabs();
  
  return (
    <div
      className="group flex flex-col w-full aspect-square rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden transition-all duration-300 relative text-left cursor-pointer hover:border-[var(--accent-primary)] hover:-translate-y-1 hover:shadow-lg"
      onClick={() => openTab(page.id, page.title, page.icon)}
    >
      {/* Icon area */}
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-secondary)] relative w-full">
        <span className="text-[42px] leading-none transition-transform duration-300 group-hover:scale-105">
          {page.icon || '📄'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnfavorite();
          }}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-[var(--bg-hover)] transition-colors"
          title="Remove from favorites"
        >
          <Star style={{ width: '16px', height: '16px', color: '#facc15', fill: '#facc15' }} />
        </button>
      </div>

      {/* Info footer */}
      <div 
        className="border-t border-[var(--border-default)] w-full"
        style={{ padding: '16px 24px' }}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
          {page.title || 'Untitled'}
        </h3>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="text-xs text-[var(--text-tertiary)] truncate">
            {formatRelativeTime(page.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Favorites Page ──────────────────────────────────── */
export default function FavoritesPage() {
  const { workspace } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    
    setLoading(true);
    const unsubscribe = subscribeToFavoritePages(workspace.id, (p) => {
      // Sort favorites by title alphabetically or by updated date. Let's do updated date for consistency.
      const sorted = [...p].sort(
        (a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)
      );
      setPages(sorted);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [workspace]);

  const handleUnfavorite = async (pageId: string) => {
    try {
      await toggleFavorite(pageId);
      toast.success('Removed from favorites');
    } catch { toast.error('Failed to update favorite'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Title / Action Header */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '48px 32px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              <Star style={{ width: '28px', height: '28px', color: '#facc15', fill: '#facc15' }} />
              <span>Favorites</span>
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Quick access to your most important pages.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Favorite Pages */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px 32px 64px',
        }}
      >
        {pages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 32px',
              borderRadius: '20px',
              border: '2px dashed var(--border-default)',
              background: 'transparent',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Star style={{ width: '28px', height: '28px', color: 'var(--text-tertiary)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No favorites yet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '300px' }}>
              Click the star icon on any page to add it to your favorites for quick access.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '20px',
            }}
          >
            {pages.map((page) => (
              <FavoriteDocCard
                key={page.id}
                page={page}
                onUnfavorite={() => handleUnfavorite(page.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
