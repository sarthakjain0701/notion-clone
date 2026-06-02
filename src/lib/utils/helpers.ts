import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a Firestore Timestamp to a relative time string
 */
export function formatRelativeTime(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '';
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

/**
 * Format a Firestore Timestamp to a readable date string
 */
export function formatDate(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '';
  return format(timestamp.toDate(), 'MMM d, yyyy');
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Truncate text to a max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Generate a random emoji for new pages
 */
export function getRandomPageEmoji(): string {
  const emojis = ['📄', '📝', '📋', '📌', '📎', '🗂️', '📁', '💡', '🎯', '⭐', '🚀', '💻', '📚', '🔖', '✨'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Extract plain text from Tiptap JSON content for search
 */
export function extractTextFromContent(content: Record<string, unknown> | null): string {
  if (!content) return '';
  
  let text = '';
  
  function traverse(node: Record<string, unknown>) {
    if (node.text && typeof node.text === 'string') {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: Record<string, unknown>) => traverse(child));
    }
  }
  
  traverse(content);
  return text.trim();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
