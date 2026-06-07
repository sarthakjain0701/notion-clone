'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTabs } from '@/lib/context/TabContext';
import { cn } from '@/lib/utils/cn';
import { Search, FileText, X } from 'lucide-react';
import { searchPages, getRecentPages } from '@/lib/firebase/firestore';
import type { Page } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils/helpers';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Page[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { workspace } = useAuth();
  const { openTab } = useTabs();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
      if (workspace) {
        getRecentPages(workspace.id, 5).then(setResults);
      }
    }
  }, [isOpen, workspace]);

  useEffect(() => {
    if (!workspace || !query.trim()) {
      if (workspace && !query.trim()) {
        getRecentPages(workspace.id, 5).then(setResults);
      }
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const r = await searchPages(workspace.id, query);
      setResults(r.slice(0, 10));
      setSelectedIndex(0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, workspace]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => (i + 1) % results.length); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => (i - 1 + results.length) % results.length); return; }
    if (e.key === 'Enter' && results[selectedIndex]) {
      const page = results[selectedIndex];
      openTab(page.id, page.title, page.icon);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-[var(--bg-overlay)]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-xl shadow-xl border border-[var(--border-default)] animate-scale-in overflow-hidden mx-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
          <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              {loading ? 'Searching...' : query ? 'No results found' : 'No recent pages'}
            </div>
          ) : (
            <>
              <div className="px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                {query ? 'Results' : 'Recent'}
              </div>
              {results.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => { openTab(page.id, page.title, page.icon); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer',
                    index === selectedIndex ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <span className="text-lg">{page.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-primary)] truncate">{page.title || 'Untitled'}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{formatRelativeTime(page.updatedAt)}</div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border-default)] text-xs text-[var(--text-tertiary)]">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
