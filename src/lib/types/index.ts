import { Timestamp } from 'firebase/firestore';
import { JSONContent } from '@tiptap/react';

// ─── User ────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'owner' | 'member' | 'guest';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
}

// ─── Workspace ───────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Page ────────────────────────────────────────────────────────────
export interface Page {
  id: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: JSONContent | null;
  parentId: string | null;
  workspaceId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isFavorite: boolean;
  isArchived: boolean;
  childOrder: string[];
  path: string;
  tags: string[];
}

export interface PageTreeItem {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  childOrder: string[];
  isFavorite: boolean;
  isArchived: boolean;
  children: PageTreeItem[];
  isExpanded?: boolean;
}

// ─── Search ──────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  title: string;
  icon: string | null;
  snippet: string;
  updatedAt: Timestamp;
  path: string;
}

// ─── UI State ────────────────────────────────────────────────────────
export interface SidebarState {
  isOpen: boolean;
  width: number;
}

export type ModalType = 'delete' | 'move' | 'emoji' | null;

// ─── Auth ────────────────────────────────────────────────────────────
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
