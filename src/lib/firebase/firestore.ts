import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Page, Workspace } from '@/lib/types';
import { nanoid } from 'nanoid';
import { getRandomPageEmoji, extractTextFromContent } from '@/lib/utils/helpers';
import { JSONContent } from '@tiptap/react';

// ─── Pages ───────────────────────────────────────────────────────────

/**
 * Create a new page
 */
export async function createPage(
  workspaceId: string,
  createdBy: string,
  parentId: string | null = null,
  title: string = 'Untitled'
): Promise<Page> {
  const id = nanoid(12);
  const now = Timestamp.now();

  // Build materialized path
  let path = `/${id}`;
  if (parentId) {
    const parentDoc = await getDoc(doc(db, 'pages', parentId));
    if (parentDoc.exists()) {
      path = `${parentDoc.data().path}/${id}`;
    }
  }

  const page: Page = {
    id,
    title,
    icon: getRandomPageEmoji(),
    coverImage: null,
    content: null,
    parentId,
    workspaceId,
    createdBy,
    updatedBy: createdBy,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isArchived: false,
    inArchive: false,
    isShared: false,
    sharedWith: [],
    shareToken: null,
    sharePermission: 'edit',
    childOrder: [],
    path,
    tags: [],
  };

  await setDoc(doc(db, 'pages', id), page);

  // Add to parent's childOrder
  if (parentId) {
    const parentRef = doc(db, 'pages', parentId);
    const parentDoc = await getDoc(parentRef);
    if (parentDoc.exists()) {
      const parentData = parentDoc.data();
      await updateDoc(parentRef, {
        childOrder: [...(parentData.childOrder || []), id],
        updatedAt: Timestamp.now(),
      });
    }
  }

  return page;
}

/**
 * Get a single page by ID
 */
export async function getPage(pageId: string): Promise<Page | null> {
  const docSnap = await getDoc(doc(db, 'pages', pageId));
  if (!docSnap.exists()) return null;
  return docSnap.data() as Page;
}

/**
 * Update a page
 */
export async function updatePage(
  pageId: string,
  updates: Partial<Page>
): Promise<void> {
  await updateDoc(doc(db, 'pages', pageId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update page content (for auto-save)
 */
export async function updatePageContent(
  pageId: string,
  content: JSONContent,
  updatedBy: string
): Promise<void> {
  const textContent = extractTextFromContent(content as Record<string, unknown>);
  await updateDoc(doc(db, 'pages', pageId), {
    content,
    updatedBy,
    updatedAt: Timestamp.now(),
    _searchText: textContent.toLowerCase(),
  });
}

/**
 * Delete a page and all its children recursively
 */
export async function deletePage(pageId: string): Promise<void> {
  const page = await getPage(pageId);
  if (!page) return;

  const batch = writeBatch(db);

  // Delete all children recursively
  async function deleteChildren(parentId: string) {
    const childrenQuery = query(
      collection(db, 'pages'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(childrenQuery);
    for (const childDoc of snapshot.docs) {
      await deleteChildren(childDoc.id);
      batch.delete(doc(db, 'pages', childDoc.id));
    }
  }

  await deleteChildren(pageId);
  batch.delete(doc(db, 'pages', pageId));

  // Remove from parent's childOrder
  if (page.parentId) {
    const parentRef = doc(db, 'pages', page.parentId);
    const parentDoc = await getDoc(parentRef);
    if (parentDoc.exists()) {
      const parentData = parentDoc.data();
      batch.update(parentRef, {
        childOrder: (parentData.childOrder || []).filter((id: string) => id !== pageId),
      });
    }
  }

  await batch.commit();
}

/**
 * Duplicate a page (shallow - does not duplicate children)
 */
export async function duplicatePage(
  pageId: string,
  userId: string
): Promise<Page | null> {
  const original = await getPage(pageId);
  if (!original) return null;

  const newPage = await createPage(
    original.workspaceId,
    userId,
    original.parentId,
    `${original.title} (Copy)`
  );

  // Copy content and icon
  await updatePage(newPage.id, {
    content: original.content,
    icon: original.icon,
    tags: original.tags,
  });

  return { ...newPage, content: original.content, icon: original.icon, tags: original.tags };
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(pageId: string): Promise<boolean> {
  const page = await getPage(pageId);
  if (!page) return false;

  const newState = !page.isFavorite;
  await updateDoc(doc(db, 'pages', pageId), {
    isFavorite: newState,
    updatedAt: Timestamp.now(),
  });
  return newState;
}

/**
 * Move a page to trash (and its children recursively)
 */
export async function moveToTrash(pageId: string): Promise<void> {
  const batch = writeBatch(db);

  async function archiveChildren(parentId: string) {
    const childrenQuery = query(
      collection(db, 'pages'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(childrenQuery);
    for (const childDoc of snapshot.docs) {
      await archiveChildren(childDoc.id);
      batch.update(doc(db, 'pages', childDoc.id), {
        isArchived: true,
        updatedAt: Timestamp.now(),
      });
    }
  }

  await archiveChildren(pageId);
  batch.update(doc(db, 'pages', pageId), {
    isArchived: true,
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}

/**
 * Restore a page from trash
 */
export async function restoreFromTrash(pageId: string): Promise<void> {
  await updateDoc(doc(db, 'pages', pageId), {
    isArchived: false,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Move a page to archive (and its children recursively)
 */
export async function archivePage(pageId: string): Promise<void> {
  const batch = writeBatch(db);

  async function archiveChildren(parentId: string) {
    const childrenQuery = query(
      collection(db, 'pages'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(childrenQuery);
    for (const childDoc of snapshot.docs) {
      await archiveChildren(childDoc.id);
      batch.update(doc(db, 'pages', childDoc.id), {
        inArchive: true,
        updatedAt: Timestamp.now(),
      });
    }
  }

  await archiveChildren(pageId);
  batch.update(doc(db, 'pages', pageId), {
    inArchive: true,
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}

/**
 * Unarchive a page
 */
export async function unarchivePage(pageId: string): Promise<void> {
  const batch = writeBatch(db);

  async function unarchiveChildren(parentId: string) {
    const childrenQuery = query(
      collection(db, 'pages'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(childrenQuery);
    for (const childDoc of snapshot.docs) {
      await unarchiveChildren(childDoc.id);
      batch.update(doc(db, 'pages', childDoc.id), {
        inArchive: false,
        updatedAt: Timestamp.now(),
      });
    }
  }

  await unarchiveChildren(pageId);
  batch.update(doc(db, 'pages', pageId), {
    inArchive: false,
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}

/**
 * Move a page to a new parent
 */
export async function movePage(
  pageId: string,
  newParentId: string | null
): Promise<void> {
  const page = await getPage(pageId);
  if (!page) return;

  const batch = writeBatch(db);

  // Remove from old parent's childOrder
  if (page.parentId) {
    const oldParentRef = doc(db, 'pages', page.parentId);
    const oldParentDoc = await getDoc(oldParentRef);
    if (oldParentDoc.exists()) {
      const oldData = oldParentDoc.data();
      batch.update(oldParentRef, {
        childOrder: (oldData.childOrder || []).filter((id: string) => id !== pageId),
      });
    }
  }

  // Build new path
  let newPath = `/${pageId}`;
  if (newParentId) {
    const newParentDoc = await getDoc(doc(db, 'pages', newParentId));
    if (newParentDoc.exists()) {
      newPath = `${newParentDoc.data().path}/${pageId}`;
    }

    // Add to new parent's childOrder
    const newParentRef = doc(db, 'pages', newParentId);
    const newParentData = (await getDoc(newParentRef)).data();
    if (newParentData) {
      batch.update(newParentRef, {
        childOrder: [...(newParentData.childOrder || []), pageId],
      });
    }
  }

  // Update the page itself
  batch.update(doc(db, 'pages', pageId), {
    parentId: newParentId,
    path: newPath,
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}

// ─── Page Queries ────────────────────────────────────────────────────

/**
 * Get all root-level pages for a workspace
 */
export async function getRootPages(workspaceId: string): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('parentId', '==', null),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.inArchive);
}

/**
 * Get child pages of a parent
 */
export async function getChildPages(parentId: string): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('parentId', '==', parentId),
    where('isArchived', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.inArchive);
}

/**
 * Get all pages for a workspace (for tree building)
 */
export async function getAllPages(workspaceId: string): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.inArchive);
}

/**
 * Get recent pages
 */
export async function getRecentPages(
  workspaceId: string,
  count: number = 8
): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Page).filter((p) => !p.inArchive);
}

/**
 * Get favorite pages
 */
export async function getFavoritePages(workspaceId: string): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isFavorite', '==', true),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Page).filter((p) => !p.inArchive);
}

export async function getTrashedPages(workspaceId: string): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', true)
  );
  const snapshot = await getDocs(q);
  const pages = snapshot.docs.map((doc) => doc.data() as Page);
  return pages.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
}

export function subscribeToTrashedPages(
  workspaceId: string,
  callback: (pages: Page[]) => void
) {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const pages = snapshot.docs.map((doc) => doc.data() as Page);
    const sortedPages = pages.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(sortedPages);
  });
}

export function subscribeToArchivedPages(
  workspaceId: string,
  callback: (pages: Page[]) => void
) {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('inArchive', '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const pages = snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.isArchived); // Exclude trashed pages
    const sortedPages = pages.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(sortedPages);
  });
}

/**
 * Empty the trash (permanently delete all trashed pages)
 */
export async function emptyTrash(workspaceId: string): Promise<void> {
  const trashedPages = await getTrashedPages(workspaceId);
  // deletePage handles recursive deletion and batching internally
  await Promise.all(trashedPages.map(page => deletePage(page.id)));
}

/**
 * Search pages by title (client-side filtering for MVP)
 */
export async function searchPages(
  workspaceId: string,
  searchQuery: string
): Promise<Page[]> {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', false)
  );
  const snapshot = await getDocs(q);
  const allPages = snapshot.docs.map((doc) => doc.data() as Page);

  const lowerQuery = searchQuery.toLowerCase();
  return allPages
    .filter((page) => !page.inArchive)
    .filter((page) => {
      const titleMatch = page.title.toLowerCase().includes(lowerQuery);
      const contentText = extractTextFromContent(page.content as Record<string, unknown> | null);
      const contentMatch = contentText.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    });
}

/**
 * Get breadcrumb trail for a page
 */
export async function getPageBreadcrumbs(
  pageId: string
): Promise<Array<{ id: string; title: string; icon: string | null }>> {
  const breadcrumbs: Array<{ id: string; title: string; icon: string | null }> = [];
  let currentId: string | null = pageId;

  while (currentId) {
    const page = await getPage(currentId);
    if (!page) break;
    breadcrumbs.unshift({ id: page.id, title: page.title, icon: page.icon });
    currentId = page.parentId;
  }

  return breadcrumbs;
}

// ─── Sharing & Real-Time ─────────────────────────────────────────────

/**
 * Generate a share token for a page and mark it as shared
 */
export async function sharePage(pageId: string, permission: 'edit' | 'view' = 'edit'): Promise<string> {
  const token = nanoid(16);
  await updateDoc(doc(db, 'pages', pageId), {
    isShared: true,
    shareToken: token,
    sharePermission: permission,
    updatedAt: Timestamp.now(),
  });
  return token;
}

/**
 * Revoke sharing for a page
 */
export async function unsharePage(pageId: string): Promise<void> {
  await updateDoc(doc(db, 'pages', pageId), {
    isShared: false,
    shareToken: null,
    sharedWith: [],
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get a page by its share token
 */
export async function getPageByShareToken(token: string): Promise<Page | null> {
  const q = query(
    collection(db, 'pages'),
    where('shareToken', '==', token),
    where('isShared', '==', true),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Page;
}

/**
 * Subscribe to real-time updates for a page (onSnapshot)
 */
export function subscribeToPage(
  pageId: string,
  callback: (page: Page | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'pages', pageId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Page);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to real-time updates for all pages in a workspace
 */
export function subscribeToWorkspacePages(
  workspaceId: string,
  callback: (pages: Page[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isArchived', '==', false)
  );
  
  return onSnapshot(q, (snapshot) => {
    const pages = snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.inArchive);
    callback(pages);
  });
}

/**
 * Subscribe to real-time updates for favorite pages in a workspace
 */
export function subscribeToFavoritePages(
  workspaceId: string,
  callback: (pages: Page[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'pages'),
    where('workspaceId', '==', workspaceId),
    where('isFavorite', '==', true),
    where('isArchived', '==', false)
  );
  
  return onSnapshot(q, (snapshot) => {
    const pages = snapshot.docs.map((doc) => doc.data() as Page).filter(p => !p.inArchive);
    callback(pages);
  });
}

/**
 * Add a user to a page's sharedWith array (idempotent)
 */
export async function addToSharedWith(pageId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'pages', pageId), {
    sharedWith: arrayUnion(userId),
  });
}

/**
 * Remove a user from a page's sharedWith array
 */
export async function removeFromSharedWith(pageId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'pages', pageId), {
    sharedWith: arrayRemove(userId),
  });
}

/**
 * Subscribe to real-time updates for pages shared with a specific user
 */
export function subscribeToSharedWithMePages(
  userId: string,
  callback: (pages: Page[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'pages'),
    where('sharedWith', 'array-contains', userId),
    where('isShared', '==', true),
    where('isArchived', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    const pages = snapshot.docs
      .map((d) => d.data() as Page)
      .filter((p) => !p.inArchive)
      .sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(pages);
  });
}

// ─── Workspace ───────────────────────────────────────────────────────

/**
 * Create a workspace
 */
export async function createWorkspace(
  name: string,
  ownerId: string
): Promise<Workspace> {
  const id = nanoid(12);
  const now = Timestamp.now();

  const workspace: Workspace = {
    id,
    name,
    icon: '🏠',
    ownerId,
    members: [ownerId],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'workspaces', id), workspace);
  return workspace;
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const docSnap = await getDoc(doc(db, 'workspaces', workspaceId));
  if (!docSnap.exists()) return null;
  return docSnap.data() as Workspace;
}

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const q = query(
    collection(db, 'workspaces'),
    where('members', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Workspace);
}
