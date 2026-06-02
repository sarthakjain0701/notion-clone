'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ChevronRight } from 'lucide-react';
import { getPageBreadcrumbs } from '@/lib/firebase/firestore';

interface HeaderProps {
  pageId?: string;
}

export function Header({ pageId }: HeaderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string; icon: string | null }>>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (pageId) {
      getPageBreadcrumbs(pageId).then(setBreadcrumbs).catch(() => {});
    } else {
      setBreadcrumbs([]);
    }
  }, [pageId]);

  const getRouteTitle = () => {
    if (pathname === '/dashboard') return 'Home';
    if (pathname === '/favorites') return 'Favorites';
    if (pathname === '/archive') return 'Archive';
    if (pathname === '/search') return 'Search';
    return null;
  };

  const routeTitle = getRouteTitle();

  return (
    <header className="flex items-center justify-between h-11 px-3 border-b border-[var(--border-default)] bg-[var(--bg-primary)] flex-shrink-0">
      <div className="flex items-center gap-1 text-sm overflow-hidden">
        {routeTitle ? (
          <span className="font-medium text-[var(--text-primary)]">{routeTitle}</span>
        ) : breadcrumbs.length > 0 ? (
          breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />}
              <Link
                href={`/page/${crumb.id}`}
                className={cn(
                  'flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors truncate max-w-[160px]',
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
      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
