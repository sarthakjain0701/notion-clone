'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Tooltip } from './Tooltip';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full border border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:opacity-80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>
    </Tooltip>
  );
}
