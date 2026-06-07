'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTabs } from '@/lib/context/TabContext';
import { PageEditor } from './PageEditor';

export function TabManager() {
  const { tabs, activeTabId, openTab, isClosing } = useTabs();
  const pathname = usePathname();
  const isPageRoute = pathname.startsWith('/page/');

  // If a user navigates directly to a URL (e.g. refresh, manual entry) 
  // and it's not in the tabs list, add it.
  useEffect(() => {
    if (isPageRoute && activeTabId) {
      if (isClosing()) return;
      
      const exists = tabs.find(t => t.id === activeTabId);
      if (!exists) {
        // Automatically add the tab if it doesn't exist.
        // The title/icon will be updated by PageEditor once it loads.
        openTab(activeTabId, 'Loading...');
      }
    }
  }, [isPageRoute, activeTabId, tabs, openTab, isClosing]);

  if (!isPageRoute) return null;

  return (
    <>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            style={{ 
              display: isActive ? 'block' : 'none',
              height: '100%',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <PageEditor pageId={tab.id} />
          </div>
        );
      })}
    </>
  );
}
