import { useChat } from '../contexts/ChatContext';

/**
 * Reusable hook to get the central real-time unread messages count.
 * Single source of truth across Student, Instructor, and Admin sidebars.
 */
export function useChatUnreadCount(): number | null {
  try {
    const { totalUnreadCount } = useChat();
    return totalUnreadCount;
  } catch {
    return 0;
  }
}
