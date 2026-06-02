'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils/cn';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import {
  ChevronRight, Plus, MoreHorizontal, Copy, Trash2, Star,
  Archive, FileText,
} from 'lucide-react';
import { getAllPages, createPage, deletePage, toggleFavorite, archivePage, duplicatePage } from '@/lib/firebase/firestore';
import type { Page, PageTreeItem } from '@/lib/types';
import toast from 'react-hot-toast';

function buildTree(pages: Page[]): PageTreeItem[] {
  const map = new Map<string, PageTreeItem>();
  const roots: PageTreeItem[] = [];

  // Create nodes
  for (const page of pages) {
    map.set(page.id, {
      id: page.id,
      title: page.title,
      icon: page.icon,
      parentId: page.parentId,
      childOrder: page.childOrder,
      isFavorite: page.isFavorite,
      isArchived: page.isArchived,
      children: [],
    });
  }

  // Build tree
  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by childOrder
  for (const node of map.values()) {
    if (node.childOrder.length > 0) {
      node.children.sort((a, b) => {
        const aIndex = node.childOrder.indexOf(a.id);
        const bIndex = node.childOrder.indexOf(b.id);
        return aIndex - bIndex;
      });
    }
  }

  return roots;
}

export function SidebarPageTree() {
  const { workspace, user } = useAuth();
  const [pages, setPages] = useState<PageTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!workspace) return;
    try {
      const allPages = await getAllPages(workspace.id);
      const tree = buildTree(allPages);
      setPages(tree);
    } catch {
      console.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Listen for page changes (simple polling for MVP)
  useEffect(() => {
    const interval = setInterval(fetchPages, 5000);
    return () => clearInterval(interval);
  }, [fetchPages]);

  if (loading) {
    return (
      <div className="space-y-1 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-tertiary)]">No pages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {pages.map((page) => (
        <TreeNode
          key={page.id}
          node={page}
          depth={0}
          onRefresh={fetchPages}
          userId={user?.uid || ''}
          workspaceId={workspace?.id || ''}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: PageTreeItem;
  depth: number;
  onRefresh: () => void;
  userId: string;
  workspaceId: string;
}

function TreeNode({ node, depth, onRefresh, userId, workspaceId }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === `/page/${node.id}`;

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const page = await createPage(workspaceId, userId, node.id, 'Untitled');
      setIsExpanded(true);
      onRefresh();
      router.push(`/page/${page.id}`);
      toast.success('Sub-page created');
    } catch {
      toast.error('Failed to create page');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePage(node.id);
      onRefresh();
      toast.success('Page deleted');
      if (isActive) router.push('/dashboard');
    } catch {
      toast.error('Failed to delete page');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicatePage(node.id, userId);
      onRefresh();
      toast.success('Page duplicated');
    } catch {
      toast.error('Failed to duplicate page');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(node.id);
      onRefresh();
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleArchive = async () => {
    try {
      await archivePage(node.id);
      onRefresh();
      toast.success('Page archived');
      if (isActive) router.push('/dashboard');
    } catch {
      toast.error('Failed to archive page');
    }
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-0.5 px-1 py-0.5 rounded-md cursor-pointer transition-colors',
          isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push(`/page/${node.id}`)}
      >
        {/* Expand/Collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            'p-0.5 rounded transition-transform cursor-pointer',
            'hover:bg-[var(--bg-active)]',
            node.children.length === 0 && 'invisible'
          )}
        >
          <ChevronRight
            className={cn(
              'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </button>

        {/* Icon */}
        <span className="text-sm flex-shrink-0 w-5 text-center">
          {node.icon || '📄'}
        </span>

        {/* Title */}
        <span className={cn(
          'flex-1 text-sm truncate',
          isActive ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
        )}>
          {node.title || 'Untitled'}
        </span>

        {/* Actions (visible on hover) */}
        {isHovered && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Dropdown
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-0.5 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] cursor-pointer"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              }
              align="right"
            >
              <DropdownItem onClick={handleToggleFavorite} icon={<Star className="w-4 h-4" />}>
                {node.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownItem>
              <DropdownItem onClick={handleDuplicate} icon={<Copy className="w-4 h-4" />}>
                Duplicate
              </DropdownItem>
              <DropdownItem onClick={handleArchive} icon={<Archive className="w-4 h-4" />}>
                Archive
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />} danger>
                Delete
              </DropdownItem>
            </Dropdown>

            <button
              onClick={handleAddChild}
              className="p-0.5 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && node.children.length > 0 && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onRefresh={onRefresh}
              userId={userId}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
