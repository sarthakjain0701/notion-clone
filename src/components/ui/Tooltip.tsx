'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap',
            'bg-[var(--text-primary)] text-[var(--bg-primary)]',
            'animate-fade-in pointer-events-none',
            position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
            position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
            position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
            position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
