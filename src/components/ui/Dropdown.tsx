'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <div
        onClick={handleTriggerClick}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(!isOpen); }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 py-1 min-w-[200px]',
            'bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg',
            'shadow-lg animate-fade-in-down',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownItem({ children, onClick, icon, danger, disabled }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        danger
          ? 'text-[var(--danger)] hover:bg-[var(--danger-bg)]'
          : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-[var(--border-default)]" />;
}
