import { useCallback } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import type { 
  ChatThread, 
  ChatMessage, 
  ChatListResponse,
  MessageListResponse,
  ChatCreateRequest,
} from "../serve/chat";
import { serv } from "../serve/serv";

// =============================================================================
// BASE ATOMS - stores chat threads and messages
// =============================================================================

// All chat threads
const threadsAtom = atom<ChatThread[]>([]);
const threadsLoadingAtom = atom<boolean>(false);
const threadsErrorAtom = atom<string | null>(null);

// Messages by thread ID
const messagesByThreadAtom = atom<Map<string, ChatMessage[]>>(new Map());
const messagesLoadingAtom = atom<Map<string, boolean>>(new Map());

// Total unread count
const totalUnreadAtom = atom<number>(0);

// =============================================================================
// DERIVED ATOMS
// =============================================================================

// Threads with unread messages
export const unreadThreadsAtom = atom((get) => {
  const threads = get(threadsAtom);
  return threads.filter((t) => t.unread_count > 0);
});

// Threads sorted by last message date
export const sortedThreadsAtom = atom((get) => {
  const threads = get(threadsAtom);
  return [...threads].sort((a, b) => {
    const aDate = a.last_message?.sent_at || a.updated_at;
    const bDate = b.last_message?.sent_at || b.updated_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
});

// Threads by type
export const spapThreadsAtom = atom((get) => {
  const threads = get(threadsAtom);
  return threads.filter((t) => t.thread_type === 'spap_discussion');
});

export const asapThreadsAtom = atom((get) => {
  const threads = get(threadsAtom);
  return threads.filter((t) => t.thread_type === 'asap_discussion');
});

export const groupThreadsAtom = atom((get) => {
  const threads = get(threadsAtom);
  return threads.filter((t) => t.thread_type === 'group_chat');
});

// =============================================================================
// HOOKS
// =============================================================================

// Main hook to manage chat threads
export const useChats = () => {
  const [threads, setThreads] = useAtom(threadsAtom);
  const [loading, setLoading] = useAtom(threadsLoadingAtom);
  const [error, setError] = useAtom(threadsErrorAtom);
  const [totalUnread, setTotalUnread] = useAtom(totalUnreadAtom);

  // Fetch all threads
  const fetchThreads = useCallback(async (forceRefresh = false) => {
    if (loading && !forceRefresh) return;
    setLoading(true);
    setError(null);
    
    try {
      const response: ChatListResponse = await serv("chat.list");
      const fetchedThreads = response.threads || [];
      setThreads(fetchedThreads);
      
      // Calculate total unread
      const unread = fetchedThreads.reduce((sum, t) => sum + t.unread_count, 0);
      setTotalUnread(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [loading, setThreads, setLoading, setError, setTotalUnread]);

  // Create a new thread
  const createThread = useCallback(async (request: ChatCreateRequest) => {
    try {
      const response = await serv("chat.create", request);
      // Refresh threads to get the new one
      await fetchThreads(true);
      return response.id;
    } catch (err) {
      throw err;
    }
  }, [fetchThreads]);

  // Leave a thread
  const leaveThread = useCallback(async (threadId: string) => {
    try {
      await serv("chat.leave", { thread_id: threadId });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch (err) {
      throw err;
    }
  }, [setThreads]);

  // Update thread in cache (e.g., after receiving new message)
  const updateThread = useCallback((threadId: string, updates: Partial<ChatThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, ...updates } : t))
    );
  }, [setThreads]);

  // Mark thread as read
  const markThreadRead = useCallback(async (threadId: string) => {
    try {
      await serv("chat.markAllRead", { thread_id: threadId });
      
      // Update local state
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t))
      );
      
      // Update total unread
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        setTotalUnread((prev) => Math.max(0, prev - thread.unread_count));
      }
    } catch (err) {
      console.error("Failed to mark thread as read:", err);
    }
  }, [threads, setThreads, setTotalUnread]);

  return {
    threads,
    loading,
    error,
    totalUnread,
    fetchThreads,
    createThread,
    leaveThread,
    updateThread,
    markThreadRead,
  };
};

// Hook for sorted threads
export const useSortedChats = () => {
  const { loading, error, fetchThreads, markThreadRead, leaveThread, totalUnread } = useChats();
  const threads = useAtomValue(sortedThreadsAtom);
  
  return {
    threads,
    loading,
    error,
    totalUnread,
    refresh: fetchThreads,
    markThreadRead,
    leaveThread,
  };
};

// Hook for unread threads only
export const useUnreadChats = () => {
  const { loading, error, fetchThreads, markThreadRead } = useChats();
  const threads = useAtomValue(unreadThreadsAtom);
  
  return {
    threads,
    loading,
    error,
    refresh: fetchThreads,
    markThreadRead,
  };
};

// =============================================================================
// MESSAGES HOOK
// =============================================================================

export const useChatMessages = (threadId: string) => {
  const [messagesByThread, setMessagesByThread] = useAtom(messagesByThreadAtom);
  const [loadingMap, setLoadingMap] = useAtom(messagesLoadingAtom);
  
  const messages = messagesByThread.get(threadId) || [];
  const loading = loadingMap.get(threadId) || false;

  // Fetch messages for a thread
  const fetchMessages = useCallback(async (options?: { before?: string; after?: string; limit?: number }) => {
    setLoadingMap((prev) => new Map(prev).set(threadId, true));
    
    try {
      const response: MessageListResponse = await serv("chat.messages.list", {
        thread_id: threadId,
        ...options,
      });
      
      const fetchedMessages = response.messages || [];
      
      // If fetching older messages (before), prepend; otherwise replace
      if (options?.before) {
        setMessagesByThread((prev) => {
          const current = prev.get(threadId) || [];
          return new Map(prev).set(threadId, [...fetchedMessages, ...current]);
        });
      } else if (options?.after) {
        // Append newer messages
        setMessagesByThread((prev) => {
          const current = prev.get(threadId) || [];
          return new Map(prev).set(threadId, [...current, ...fetchedMessages]);
        });
      } else {
        // Replace all
        setMessagesByThread((prev) => new Map(prev).set(threadId, fetchedMessages));
      }
      
      return fetchedMessages;
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      return [];
    } finally {
      setLoadingMap((prev) => new Map(prev).set(threadId, false));
    }
  }, [threadId, setMessagesByThread, setLoadingMap]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    try {
      const response = await serv("chat.messages.send", {
        thread_id: threadId,
        content,
      });
      
      // Optimistically add to messages (will be replaced by real data on refresh)
      // For now, just refresh messages
      await fetchMessages();
      
      return response.id;
    } catch (err) {
      throw err;
    }
  }, [threadId, fetchMessages]);

  // Edit a message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await serv("chat.messages.update", {
        thread_id: threadId,
        message_id: messageId,
        content,
      });
      
      // Update local state
      setMessagesByThread((prev) => {
        const current = prev.get(threadId) || [];
        const updated = current.map((m) =>
          m.id === messageId ? { ...m, content, edited_at: new Date().toISOString() } : m
        );
        return new Map(prev).set(threadId, updated);
      });
    } catch (err) {
      throw err;
    }
  }, [threadId, setMessagesByThread]);

  // Mark message as read
  const markMessageRead = useCallback(async (messageId: string) => {
    try {
      await serv("chat.messages.markRead", {
        thread_id: threadId,
        message_id: messageId,
      });
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  }, [threadId]);

  // Add a message to local cache (for real-time updates)
  const addMessage = useCallback((message: ChatMessage) => {
    setMessagesByThread((prev) => {
      const current = prev.get(threadId) || [];
      // Avoid duplicates
      if (current.some((m) => m.id === message.id)) {
        return prev;
      }
      return new Map(prev).set(threadId, [...current, message]);
    });
  }, [threadId, setMessagesByThread]);

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage,
    editMessage,
    markMessageRead,
    addMessage,
  };
};

// =============================================================================
// STANDALONE FUNCTIONS
// =============================================================================

// Get unread count for a specific thread
export const getUnreadCount = async (threadId: string): Promise<number> => {
  const response = await serv("chat.unreadCount", { thread_id: threadId });
  return response.unread_count;
};

// Get thread details
export const getThreadDetails = async (threadId: string): Promise<ChatThread> => {
  const response = await serv("chat.get", { thread_id: threadId });
  return response.thread;
};
