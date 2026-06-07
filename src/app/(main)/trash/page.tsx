'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { subscribeToTrashedPages, restoreFromTrash, deletePage, emptyTrash } from '@/lib/firebase/firestore';
import { Spinner } from '@/components/ui/Spinner';
import { Trash2, RotateCcw } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

/* ── Trash Document Card ─────────────────────────── */
function TrashDocCard({
  page,
  onRestore,
  onDelete,
}: {
  page: Page;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group flex flex-col w-full aspect-square rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden transition-all duration-300 relative text-left cursor-default hover:border-[var(--accent-primary)] hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Icon area */}
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-secondary)] relative w-full">
        <span className="text-[42px] leading-none transition-transform duration-300 group-hover:scale-105">
          {page.icon || '📄'}
        </span>
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
          <Trash2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="text-xs text-[var(--text-tertiary)] truncate">
            Deleted {formatRelativeTime(page.updatedAt)}
          </span>
        </div>
      </div>

      {/* Hover overlay with actions */}
      <div
        className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none group-hover:pointer-events-auto z-10"
        style={{ padding: '24px', gap: '8px' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onRestore(); }}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer border-none"
          style={{ padding: '12px 8px' }}
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Restore</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer border-none"
          style={{ padding: '12px 8px' }}
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

/* ── Trash Page ──────────────────────────────────── */
export default function TrashPage() {
  const { workspace } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmptying, setIsEmptying] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    
    setLoading(true);
    const unsubscribe = subscribeToTrashedPages(workspace.id, (p) => {
      setPages(p);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [workspace]);

  const handleRestore = async (pageId: string) => {
    try {
      await restoreFromTrash(pageId);
      toast.success('Page restored');
    } catch { toast.error('Failed to restore'); }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Permanently delete this page?')) return;
    try {
      await deletePage(pageId);
      toast.success('Page permanently deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleEmptyTrash = async () => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to permanently delete all items in the trash? This action cannot be undone.')) return;
    
    setIsEmptying(true);
    try {
      await emptyTrash(workspace.id);
      toast.success('Trash emptied');
    } catch {
      toast.error('Failed to empty trash');
    } finally {
      setIsEmptying(false);
    }
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
              <Trash2 style={{ width: '28px', height: '28px', color: 'var(--danger)' }} />
              <span>Trash</span>
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Restore pages or permanently delete them from the workspace.
            </p>
          </div>
          {pages.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={isEmptying}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.background = 'var(--danger-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isEmptying ? 'Emptying...' : 'Empty Trash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Trashed Pages */}
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
              <Trash2 style={{ width: '28px', height: '28px', color: 'var(--text-tertiary)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Trash is empty
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '300px' }}>
              Deleted pages will show up here. You can restore them at any time.
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
              <TrashDocCard
                key={page.id}
                page={page}
                onRestore={() => handleRestore(page.id)}
                onDelete={() => handleDelete(page.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
