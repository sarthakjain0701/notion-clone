'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { TabManager } from '@/components/pages/TabManager';
import { useRouter } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Get page ID from route params
  const pageId = pathname.startsWith('/page/') ? (params.id as string) : undefined;
  const isPageRoute = pathname.startsWith('/page/');

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <FullPageSpinner />;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSearchOpen={() => setCommandPaletteOpen(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          pageId={pageId} 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-hidden relative">
          <TabManager />
          {!isPageRoute && children}
        </div>
      </main>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
