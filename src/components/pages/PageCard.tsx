'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Page } from '@/lib/types';
import { Star } from 'lucide-react';

interface PageCardProps {
  page: Page;
  className?: string;
}

export function PageCard({ page, className }: PageCardProps) {
  return (
    <Link
      href={`/page/${page.id}`}
      className={cn(
        'block p-4 rounded-xl border border-[var(--border-default)]',
        'bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        'group',
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{page.icon || '📄'}</span>
        {page.isFavorite && (
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
        {page.title || 'Untitled'}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)]">
        {formatRelativeTime(page.updatedAt)}
      </p>
    </Link>
  );
}
