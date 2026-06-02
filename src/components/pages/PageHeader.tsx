'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { updatePage } from '@/lib/firebase/firestore';
import type { Page } from '@/lib/types';

interface PageHeaderProps {
  page: Page;
  onUpdate: (updates: Partial<Page>) => void;
}

export function PageHeader({ page, onUpdate }: PageHeaderProps) {
  const [title, setTitle] = useState(page.title);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

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
      <div className="h-[120px] bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--highlight-purple)]/30 to-[var(--highlight-blue)]/20 rounded-lg mb-6" />

      {/* Icon */}
      <button
        onClick={handleIconClick}
        className="text-5xl -mt-12 ml-2 cursor-pointer hover:scale-110 transition-transform"
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
