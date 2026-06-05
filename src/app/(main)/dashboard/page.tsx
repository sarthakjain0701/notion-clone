'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { subscribeToWorkspacePages, createPage } from '@/lib/firebase/firestore';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { Plus, Clock, Star, FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

/* ── Greeting helper ─────────────────────────────── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── New Page Card ───────────────────────────────── */
function NewPageCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '20px',
        border: '2px dashed var(--border-strong)',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        color: 'var(--text-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="group"
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--accent-primary)';
        el.style.background = 'var(--accent-bg)';
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--border-strong)';
        el.style.background = 'transparent';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
        }}
      >
        <Plus style={{ width: '24px', height: '24px', color: '#fff' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>New page</span>
    </button>
  );
}

/* ── Document Card ───────────────────────────────── */
function DocCard({ page }: { page: Page }) {
  return (
    <Link
      href={`/page/${page.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '20px',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = 'var(--shadow-lg)';
        el.style.borderColor = 'var(--accent-primary)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
        el.style.borderColor = 'var(--border-default)';
      }}
    >
      {/* Icon area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-secondary)',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '42px', lineHeight: 1, transition: 'transform 0.3s ease' }}>
          {page.icon || '📄'}
        </span>
        {page.isFavorite && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
            }}
          >
            <Star style={{ width: '14px', height: '14px', color: '#facc15', fill: '#facc15' }} />
          </div>
        )}
      </div>

      {/* Info footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '4px',
          }}
        >
          {page.title || 'Untitled'}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock style={{ width: '11px', height: '11px', color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {formatRelativeTime(page.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Dashboard Page ──────────────────────────────── */
export default function DashboardPage() {
  const { user, workspace } = useAuth();
  const router = useRouter();
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;

    setLoading(true);
    const unsubscribe = subscribeToWorkspacePages(workspace.id, (pages) => {
      const sorted = [...pages].sort(
        (a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)
      );
      setRecentPages(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ── Hero / Greeting ──────────────────────── */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '48px 32px 16px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}
        >
          {getGreeting()}, {firstName} 👋
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            marginBottom: '0',
          }}
        >
          Pick up where you left off, or start something new.
        </p>
      </div>

      {/* ── Document Grid ────────────────────────── */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px 32px 64px',
        }}
      >
        {/* Section Label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <Sparkles style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Recent pages
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'var(--border-default)',
              marginLeft: '8px',
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '20px',
          }}
        >
          {/* New page card always first */}
          <NewPageCard onClick={handleNewPage} />

          {recentPages.map((page) => (
            <DocCard key={page.id} page={page} />
          ))}
        </div>

        {recentPages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
            }}
          >
            <FileText
              style={{
                width: '48px',
                height: '48px',
                color: 'var(--text-tertiary)',
                margin: '0 auto 16px',
                opacity: 0.5,
              }}
            />
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              No pages yet
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Create your first page to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
