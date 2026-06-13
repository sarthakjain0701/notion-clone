'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTabs } from '@/lib/context/TabContext';
import { cn } from '@/lib/utils/cn';
import { SidebarPageTree } from './SidebarPageTree';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import {
  Search, Star, Plus, Archive, Settings, LogOut,
  ChevronsLeft, Home, ChevronDown, ChevronRight, SquarePen, Trash2, Users, X
} from 'lucide-react';
import { createPage, subscribeToSharedWithMePages, removeFromSharedWith } from '@/lib/firebase/firestore';
import type { Page } from '@/lib/types';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSearchOpen: () => void;
}

export function Sidebar({ isOpen, onToggle, onSearchOpen }: SidebarProps) {
  const { user, workspace, signOut } = useAuth();
  const { openTab } = useTabs();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [sharedPages, setSharedPages] = useState<Page[]>([]);
  const [sharedExpanded, setSharedExpanded] = useState(true);

  const handleNewPage = async () => {
    if (!workspace || !user || isCreating) return;
    setIsCreating(true);
    try {
      const page = await createPage(workspace.id, user.uid, null, 'Untitled');
      openTab(page.id, 'Untitled', null);
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

  // Subscribe to pages shared with the current user
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSharedWithMePages(user.uid, (pages) => {
      setSharedPages(pages);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRemoveShared = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await removeFromSharedWith(pageId, user.uid);
      toast.success('Removed from shared pages');
    } catch {
      toast.error('Failed to remove');
    }
  };

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
          'bg-[var(--bg-sidebar)]',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-[260px] translate-x-0 border-r border-[var(--border-default)]' : 'w-0 -translate-x-[260px] md:translate-x-0'
        )}
      >
        <div className={cn('flex flex-col h-full overflow-hidden', !isOpen && 'invisible')}>
          {/* Workspace header — now includes avatar + user info */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-default)]">
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[var(--bg-hover)] cursor-pointer transition-colors">
                  <Avatar name={user?.displayName || 'User'} size="xs" src={user?.photoURL} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[130px] leading-tight">
                      {user?.displayName || 'User'}&apos;s Notion
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />
                </div>
              }
            >
              {/* User info inside dropdown */}
              <div className="px-3 py-2.5 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user?.displayName || 'User'} size="sm" src={user?.photoURL} />
                  <div className="flex flex-col -space-y-0.5">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate leading-tight">{user?.displayName}</p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate leading-tight">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownItem onClick={() => router.push('/settings')} icon={<Settings className="w-4 h-4" />}>
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

          {/* Quick actions & Favorites */}
          <div className="px-2 py-2">
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
            <div className="my-1.5 border-t border-[var(--border-default)] mx-1" />
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <div className="my-1.5 border-t border-[var(--border-default)] mx-1" />
            <button
              onClick={() => router.push('/favorites')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Star className="w-4 h-4" />
              <span>Favorites</span>
            </button>

            {/* Shared with me */}
            {sharedPages.length > 0 && (
              <>
                <div className="my-1.5 border-t border-[var(--border-default)] mx-1" />
                <button
                  onClick={() => setSharedExpanded(!sharedExpanded)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Shared with me</span>
                  <span className="ml-auto text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full">
                    {sharedPages.length}
                  </span>
                  <ChevronRight className={cn(
                    'w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-200',
                    sharedExpanded && 'rotate-90'
                  )} />
                </button>
                {sharedExpanded && (
                  <div className="mt-0.5 space-y-0.5 animate-fade-in">
                    {sharedPages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => router.push(`/shared/${page.shareToken}`)}
                        className="group flex items-center gap-2 px-2.5 py-1.5 ml-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        <span className="text-sm flex-shrink-0 w-5 text-center">
                          {page.icon || '📄'}
                        </span>
                        <span className="flex-1 truncate text-sm">
                          {page.title || 'Untitled'}
                        </span>
                        <span className={cn(
                          'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0',
                          page.sharePermission === 'edit'
                            ? 'bg-blue-500/15 text-blue-500'
                            : 'bg-amber-500/15 text-amber-500'
                        )}>
                          {page.sharePermission === 'edit' ? 'Edit' : 'View'}
                        </span>
                        <button
                          onClick={(e) => handleRemoveShared(e, page.id)}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                          title="Remove from shared"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="my-1.5 border-t border-[var(--border-default)] mx-1" />
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

          {/* Archive & Trash links */}
          <div className="px-2 py-2 border-t border-[var(--border-default)]">
            <button
              onClick={() => router.push('/archive')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
            <div className="my-1.5 border-t border-[var(--border-default)] mx-1" />
            <button
              onClick={() => router.push('/trash')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Trash</span>
            </button>
          </div>

          {/* Bottom bar — "New page" button like Notion's "New chat" + theme toggle */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handleNewPage}
                disabled={isCreating}
                className="w-[150px] flex items-center justify-center gap-2 h-9 rounded-full border border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:opacity-80 transition-all cursor-pointer"
              >
                <SquarePen className="w-4 h-4" />
                <span>New page</span>
              </button>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => router.push('/settings')}
                  className="w-9 h-9 rounded-full border border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:opacity-80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer flex items-center justify-center"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar reopen is handled by the hamburger Menu button in the Header */}
    </>
  );
}
