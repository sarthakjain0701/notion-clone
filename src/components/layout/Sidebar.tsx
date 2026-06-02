'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils/cn';
import { SidebarPageTree } from './SidebarPageTree';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import {
  Search, Star, Plus, Archive, Settings, LogOut,
  ChevronsLeft, ChevronsRight, Home, ChevronDown,
} from 'lucide-react';
import { createPage } from '@/lib/firebase/firestore';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSearchOpen: () => void;
}

export function Sidebar({ isOpen, onToggle, onSearchOpen }: SidebarProps) {
  const { user, workspace, signOut } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewPage = async () => {
    if (!workspace || !user || isCreating) return;
    setIsCreating(true);
    try {
      const page = await createPage(workspace.id, user.uid, null, 'Untitled');
      router.push(`/page/${page.id}`);
      toast.success('Page created');
    } catch {
      toast.error('Failed to create page');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isOpen) {
        onToggle();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[var(--bg-overlay)] z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed md:relative z-40 h-screen flex flex-col',
          'bg-[var(--bg-sidebar)] border-r border-[var(--border-default)]',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-[260px] md:translate-x-0'
        )}
      >
        <div className={cn('flex flex-col h-full overflow-hidden', !isOpen && 'invisible')}>
          {/* Workspace header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-default)]">
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer transition-colors">
                  <Avatar name={workspace?.name || 'Workspace'} size="sm" />
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[140px]">
                    {workspace?.name || 'Workspace'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
                </div>
              }
            >
              <div className="px-3 py-2 border-b border-[var(--border-default)]">
                <p className="text-xs text-[var(--text-tertiary)]">Signed in as</p>
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownItem onClick={() => {}} icon={<Settings className="w-4 h-4" />}>
                Settings
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={handleSignOut} icon={<LogOut className="w-4 h-4" />} danger>
                Sign out
              </DropdownItem>
            </Dropdown>

            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="px-2 py-2 space-y-0.5">
            <button
              onClick={onSearchOpen}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
              <span className="ml-auto text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>

          {/* Favorites */}
          <div className="px-2 py-1">
            <button
              onClick={() => router.push('/favorites')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Star className="w-4 h-4" />
              <span>Favorites</span>
            </button>
          </div>

          {/* Page tree */}
          <div className="flex-1 overflow-y-auto px-2 py-1 no-scrollbar">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Pages
              </span>
              <button
                onClick={handleNewPage}
                disabled={isCreating}
                className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <SidebarPageTree />
          </div>

          {/* Archive link */}
          <div className="px-2 py-1 border-t border-[var(--border-default)]">
            <button
              onClick={() => router.push('/archive')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <Avatar name={user?.displayName || 'User'} size="sm" src={user?.photoURL} />
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">
                {user?.displayName}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Collapsed toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-20 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all duration-200 cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
