'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { updatePage, getPageBreadcrumbs } from '@/lib/firebase/firestore';
import type { Page } from '@/lib/types';
import { useTabs } from '@/lib/context/TabContext';

interface PageHeaderProps {
  page: Page;
  onUpdate: (updates: Partial<Page>) => void;
}

export function PageHeader({ page, onUpdate }: PageHeaderProps) {
  const [title, setTitle] = useState(page.title);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string; icon: string | null }>>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { openTab } = useTabs();

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  useEffect(() => {
    getPageBreadcrumbs(page.id).then(setBreadcrumbs).catch(() => {});
  }, [page.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePage(page.id, { title: newTitle });
      onUpdate({ title: newTitle });
    }, 500);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      titleRef.current?.blur();
    }
  };

  const handleIconClick = () => {
    const emoji = window.prompt('Enter an emoji for this page:', page.icon || '📄');
    if (emoji !== null) {
      updatePage(page.id, { icon: emoji });
      onUpdate({ icon: emoji });
    }
  };

  return (
    <div className="mb-6">
      {/* Cover gradient */}
      <div className="h-[120px] bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--highlight-purple)]/30 to-[var(--highlight-blue)]/20 rounded-lg mb-6 relative" />

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] mt-2 mb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          {breadcrumbs.map((crumb, index) => {
            // Last item is the current page, we can show it as text or not show it.
            // Actually, showing the full path is good. We'll disable link for the last one.
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                {index > 0 && <span>/</span>}
                <button
                  onClick={() => {
                    if (!isLast) openTab(crumb.id, crumb.title, crumb.icon);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors',
                    !isLast ? 'hover:text-[var(--text-primary)] cursor-pointer' : 'text-[var(--text-secondary)] font-medium cursor-default'
                  )}
                >
                  {crumb.icon && <span>{crumb.icon}</span>}
                  <span className="truncate max-w-[150px]">{crumb.title || 'Untitled'}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Icon */}
      <button
        onClick={handleIconClick}
        className={cn(
          "text-5xl ml-2 cursor-pointer hover:scale-110 transition-transform",
          breadcrumbs.length > 1 ? "-mt-4" : "-mt-12"
        )}
        title="Change icon"
      >
        {page.icon || '📄'}
      </button>

      {/* Title */}
      <input
        ref={titleRef}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        className={cn(
          'w-full text-[2.5rem] font-bold bg-transparent border-none outline-none mt-3',
          'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          'leading-tight'
        )}
      />
    </div>
  );
}
