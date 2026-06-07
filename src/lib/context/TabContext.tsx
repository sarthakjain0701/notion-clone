'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface Tab {
  id: string;
  title: string;
  icon: string | null;
  isDirty: boolean;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (id: string, title?: string, icon?: string | null) => void;
  closeTab: (id: string) => void;
  isClosing: () => boolean;
  updateTabMeta: (id: string, updates: Partial<Tab>) => void;
  markDirty: (id: string, isDirty: boolean) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const STORAGE_KEY = 'notion_clone_tabs';

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const isClosingRef = useRef(false);

  // The active tab is determined by the URL
  const activeTabId = pathname.startsWith('/page/') ? pathname.split('/')[2] : null;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTabs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load tabs from local storage', e);
    }
  }, []);

  // Save to localStorage whenever tabs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (e) {
      console.error('Failed to save tabs to local storage', e);
    }
  }, [tabs]);

  const openTab = useCallback((id: string, title = 'Untitled', icon: string | null = null) => {
    isClosingRef.current = false;
    setTabs((prev) => {
      const exists = prev.find((t) => t.id === id);
      if (!exists) {
        return [...prev, { id, title, icon, isDirty: false }];
      }
      return prev;
    });
    router.push(`/page/${id}`);
  }, [router]);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;

      const tab = prev[index];
      if (tab.isDirty) {
        if (!window.confirm(`You have unsaved changes in "${tab.title}". Are you sure you want to close it?`)) {
          return prev;
        }
      }

      const newTabs = [...prev];
      newTabs.splice(index, 1);

      // If we are closing the active tab, navigate to another tab or dashboard
      if (id === activeTabId) {
        isClosingRef.current = true;
        if (newTabs.length > 0) {
          // Prefer the tab to the right, or the one to the left if it was the last tab
          const nextTab = newTabs[Math.min(index, newTabs.length - 1)];
          router.push(`/page/${nextTab.id}`);
        } else {
          router.push('/dashboard');
        }
      }

      return newTabs;
    });
  }, [activeTabId, router]);

  const isClosing = () => isClosingRef.current;

  const updateTabMeta = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const markDirty = useCallback((id: string, isDirty: boolean) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id && t.isDirty !== isDirty ? { ...t, isDirty } : t))
    );
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W to close active tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        if (activeTabId) {
          e.preventDefault();
          closeTab(activeTabId);
        }
      }

      // Ctrl+Tab and Ctrl+Shift+Tab
      if ((e.ctrlKey) && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length > 1) {
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          if (currentIndex !== -1) {
            let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex >= tabs.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = tabs.length - 1;
            router.push(`/page/${tabs[nextIndex].id}`);
          } else if (tabs.length > 0) {
             router.push(`/page/${tabs[0].id}`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, closeTab, router]);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, isClosing, updateTabMeta, markDirty }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
}
