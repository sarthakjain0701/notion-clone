'use client';

import React, { useRef, useEffect } from 'react';
import { useTabs } from '@/lib/context/TabContext';
import { cn } from '@/lib/utils/cn';
import { X, Circle } from 'lucide-react';

export function TabBar() {
  const { tabs, activeTabId, closeTab, openTab } = useTabs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeTabRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      if (tabRect.left < containerRect.left) {
        container.scrollLeft -= containerRect.left - tabRect.left + 20;
      } else if (tabRect.right > containerRect.right) {
        container.scrollLeft += tabRect.right - containerRect.right + 20;
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end h-full flex-1 min-w-0">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar h-full w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => openTab(tab.id, tab.title, tab.icon)}
              className={cn(
                'group flex items-center gap-2 h-full px-3 min-w-[120px] max-w-[200px] border-r border-[var(--border-default)] cursor-pointer transition-colors relative',
                isActive 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' 
                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {/* Active Tab Top Accent */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)]" />
              )}
              
              <span className="text-sm flex-shrink-0 opacity-80">{tab.icon || '📄'}</span>
              <span className="text-sm truncate flex-1 text-left font-medium">{tab.title || 'Untitled'}</span>
              
              <div 
                className="flex items-center justify-center w-5 h-5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                {/* Show dot if dirty, show X if hovered or if it's not dirty and hovered. 
                    Actually, VS Code style: if dirty, show dot. On hover of the close area, show X instead of dot. */}
                {tab.isDirty ? (
                  <div className="group-hover/close:hidden flex items-center justify-center w-full h-full">
                    <div className="w-2 h-2 rounded-full bg-[var(--text-primary)] opacity-50" />
                  </div>
                ) : null}
                
                <div className={cn(
                  'w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--bg-active)] group/close',
                  tab.isDirty ? 'hidden group-hover:flex' : 'opacity-0 group-hover:opacity-100',
                  isActive && !tab.isDirty && 'opacity-100' // optionally always show X on active tab if not dirty
                )}>
                  <X className="w-3 h-3 text-[var(--text-secondary)]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
