'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { ChevronRight, Menu } from 'lucide-react';
import { getPageBreadcrumbs, subscribeToPage } from '@/lib/firebase/firestore';

import { TabBar } from '@/components/layout/TabBar';

interface HeaderProps {
  pageId?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ pageId, sidebarOpen = true, onToggleSidebar }: HeaderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string; icon: string | null }>>([]);
  const pathname = usePathname();

  // Fetch breadcrumbs initially
  useEffect(() => {
    if (pageId) {
      getPageBreadcrumbs(pageId).then(setBreadcrumbs).catch(() => {});
    } else {
      setBreadcrumbs([]);
    }
  }, [pageId]);

  // Subscribe to real-time updates so title changes reflect immediately
  useEffect(() => {
    if (!pageId) return;

    const unsubscribe = subscribeToPage(pageId, (updatedPage) => {
      if (!updatedPage) return;
      setBreadcrumbs((prev) =>
        prev.map((crumb) =>
          crumb.id === pageId
            ? { ...crumb, title: updatedPage.title, icon: updatedPage.icon }
            : crumb
        )
      );
    });

    return () => unsubscribe();
  }, [pageId]);

  const getRouteTitle = () => {
    if (pathname === '/favorites') return 'Favorites';
    if (pathname === '/trash') return 'Trash';
    if (pathname === '/search') return 'Search';
    if (pathname === '/settings') return 'Settings';
    return null;
  };

  const routeTitle = getRouteTitle();

  return (
    <header className="flex items-center h-12 border-b border-[var(--border-default)] bg-[var(--bg-primary)] flex-shrink-0 w-full overflow-hidden">
      <div className={cn("flex items-center h-full", !pageId ? "px-4 w-full justify-between" : "w-full")}>
        <div className={cn("flex items-center h-full gap-2 text-sm overflow-hidden", pageId && "flex-1 min-w-0")}>
          {!sidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              style={{ padding: '8px', marginLeft: pageId ? '8px' : '4px', marginRight: '8px' }}
              className="rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer flex-shrink-0"
            >
              <Menu style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          {pageId ? (
            <TabBar />
          ) : routeTitle ? (
            <span className="font-medium text-[var(--text-primary)]">{routeTitle}</span>
          ) : breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />}
                <Link
                  href={`/page/${crumb.id}`}
                  className={cn(
                    'flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors truncate max-w-[180px]',
                    index === breadcrumbs.length - 1 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                  )}
                >
                  <span className="text-sm">{crumb.icon || '📄'}</span>
                  <span className="truncate">{crumb.title || 'Untitled'}</span>
                </Link>
              </React.Fragment>
            ))
          ) : null}
        </div>
        {!pageId && (
          <div className="flex items-center gap-2">
            {/* Intentionally left empty for future top-right actions (like share/menu) */}
          </div>
        )}
      </div>
    </header>
  );
}
