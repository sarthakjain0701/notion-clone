'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTabs } from '@/lib/context/TabContext';
import { cn } from '@/lib/utils/cn';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import {
  ChevronRight, Plus, MoreHorizontal, Copy, Trash2, Star,
  Archive, FileText,
} from 'lucide-react';
import { subscribeToWorkspacePages, createPage, moveToTrash, toggleFavorite, duplicatePage, archivePage } from '@/lib/firebase/firestore';
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

  useEffect(() => {
    if (!workspace) return;

    setLoading(true);
    const unsubscribe = subscribeToWorkspacePages(workspace.id, (allPages) => {
      const tree = buildTree(allPages);
      setPages(tree);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspace]);

  // We no longer need fetchPages or polling since we use onSnapshot

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
  userId: string;
  workspaceId: string;
}

function TreeNode({ node, depth, userId, workspaceId }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { openTab, activeTabId, closeTab } = useTabs();
  const isActive = activeTabId === node.id;

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const page = await createPage(workspaceId, userId, node.id, 'Untitled');
      setIsExpanded(true);
      openTab(page.id, 'Untitled', null);
      toast.success('Sub-page created');
    } catch {
      toast.error('Failed to create page');
    }
  };

  const handleDelete = async () => {
    try {
      await moveToTrash(node.id);
      toast.success('Page moved to trash');
      closeTab(node.id);
    } catch {
      toast.error('Failed to move page to trash');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicatePage(node.id, userId);
      toast.success('Page duplicated');
    } catch {
      toast.error('Failed to duplicate page');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(node.id);
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleArchive = async () => {
    try {
      await archivePage(node.id);
      toast.success('Page archived');
      closeTab(node.id);
    } catch {
      toast.error('Failed to archive page');
    }
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-0.5 px-1 py-1 rounded-md cursor-pointer transition-colors',
          isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => openTab(node.id, node.title, node.icon)}
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

        {/* Actions — always visible, slightly transparent until hovered */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
          <Dropdown
            trigger={
              <button
                className="p-1 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
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
            className="p-1 rounded hover:bg-[var(--bg-active)] text-[var(--text-tertiary)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && node.children.length > 0 && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              userId={userId}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
