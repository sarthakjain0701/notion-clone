'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, style, ...props }, ref) => {
    // Compute padding explicitly to avoid Tailwind merge conflicts
    const paddingStyle: React.CSSProperties = {
      paddingLeft: icon ? '2.75rem' : '1rem',
      paddingRight: rightIcon ? '2.75rem' : '1rem',
      ...style,
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={paddingStyle}
            className={cn(
              'w-full rounded-xl bg-[var(--bg-secondary)] py-3 text-sm',
              'border-2 border-[var(--border-default)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)]',
              'hover:border-[var(--border-strong)]',
              error && 'border-[var(--danger)] focus:border-[var(--danger)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
