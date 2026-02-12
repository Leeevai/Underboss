import { useCallback, useRef } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import type { Spap, SpapDetail } from "../serve/spap";
import { serv, getCurrentUser } from "../serve/serv";
import { removeThreadFromCacheImperative } from "./chats";

// =============================================================================
// BASE ATOMS - stores all spaps (my applications)
// =============================================================================

const spapsAtom = atom<Spap[]>([]);
const spapsLoadingAtom = atom<boolean>(false);
const spapsErrorAtom = atom<string | null>(null);

// =============================================================================
// RECEIVED APPLICATIONS ATOMS (applications to our PAPS)
// =============================================================================

export interface ReceivedApplication extends SpapDetail {
  paps_id: string;
  paps_owner_id: string;
  // Applicant info from joined user data
  applicant_username?: string;
  applicant_display_name?: string;
  applicant_photo?: string;
}

const receivedSpapsAtom = atom<ReceivedApplication[]>([]);
const receivedSpapsLoadingAtom = atom<boolean>(false);
const receivedSpapsErrorAtom = atom<string | null>(null);

// =============================================================================
// DERIVED ATOMS - filtered views by status
// =============================================================================

// Pending applications
export const pendingSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return spaps.filter((s) => s.status === "pending");
});

// Accepted applications
export const acceptedSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return spaps.filter((s) => s.status === "accepted");
});

// Rejected applications
export const rejectedSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return spaps.filter((s) => s.status === "rejected");
});

// Withdrawn applications
export const withdrawnSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return spaps.filter((s) => s.status === "withdrawn");
});

// Active applications (pending + accepted)
export const activeSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return spaps.filter((s) => s.status === "pending" || s.status === "accepted");
});

// Sorted by most recent
export const recentSpapsAtom = atom((get) => {
  const spaps = get(spapsAtom);
  return [...spaps].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
});

// =============================================================================
// RECEIVED APPLICATIONS DERIVED ATOMS
// =============================================================================

// Pending received applications (awaiting our decision)
export const pendingReceivedSpapsAtom = atom((get) => {
  const spaps = get(receivedSpapsAtom);
  return spaps.filter((s) => s.status === "pending");
});

// Accepted received applications
export const acceptedReceivedSpapsAtom = atom((get) => {
  const spaps = get(receivedSpapsAtom);
  return spaps.filter((s) => s.status === "accepted");
});

// Rejected received applications
export const rejectedReceivedSpapsAtom = atom((get) => {
  const spaps = get(receivedSpapsAtom);
  return spaps.filter((s) => s.status === "rejected");
});

// =============================================================================
// HOOKS
// =============================================================================

// Main hook to fetch and manage spaps
export const useSpaps = () => {
  const [spaps, setSpaps] = useAtom(spapsAtom);
  const [loading, setLoading] = useAtom(spapsLoadingAtom);
  const [error, setError] = useAtom(spapsErrorAtom);
  const fetchingRef = useRef(false);

  const fetchSpaps = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await serv("spap.my");
      setSpaps(response.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [setSpaps, setLoading, setError]);

  // Update a single spap in cache
  const updateSpap = useCallback((spapId: string, updates: Partial<Spap>) => {
    setSpaps((prev) =>
      prev.map((s) => (s.id === spapId ? { ...s, ...updates } : s))
    );
  }, [setSpaps]);

  // Remove a spap from cache
  const removeSpap = useCallback((spapId: string) => {
    setSpaps((prev) => prev.filter((s) => s.id !== spapId));
  }, [setSpaps]);

  // Add a new spap to cache
  const addSpap = useCallback((spap: Spap) => {
    setSpaps((prev) => [spap, ...prev]);
  }, [setSpaps]);

  return { spaps, loading, error, fetchSpaps, setSpaps, updateSpap, removeSpap, addSpap };
};

// Hook for pending applications
export const usePendingSpaps = () => {
  const { loading, error, fetchSpaps, updateSpap, removeSpap } = useSpaps();
  const pending = useAtomValue(pendingSpapsAtom);
  return { spaps: pending, loading, error, refresh: fetchSpaps, updateSpap, removeSpap };
};

// Hook for accepted applications
export const useAcceptedSpaps = () => {
  const { loading, error, fetchSpaps } = useSpaps();
  const accepted = useAtomValue(acceptedSpapsAtom);
  return { spaps: accepted, loading, error, refresh: fetchSpaps };
};

// Hook for active applications (pending + accepted)
export const useActiveSpaps = () => {
  const { loading, error, fetchSpaps, updateSpap, removeSpap } = useSpaps();
  const active = useAtomValue(activeSpapsAtom);
  return { spaps: active, loading, error, refresh: fetchSpaps, updateSpap, removeSpap };
};

// Hook for recent applications (sorted by date)
export const useRecentSpaps = () => {
  const { loading, error, fetchSpaps, updateSpap, removeSpap } = useSpaps();
  const recent = useAtomValue(recentSpapsAtom);
  return { spaps: recent, loading, error, refresh: fetchSpaps, updateSpap, removeSpap };
};

// =============================================================================
// RECEIVED APPLICATIONS HOOK
// =============================================================================

// Hook for applications received on user's own PAPS
export const useReceivedSpaps = () => {
  const [spaps, setSpaps] = useAtom(receivedSpapsAtom);
  const [loading, setLoading] = useAtom(receivedSpapsLoadingAtom);
  const [error, setError] = useAtom(receivedSpapsErrorAtom);
  const fetchingRef = useRef(false);

  const fetchReceivedSpaps = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setSpaps([]);
        return;
      }
      
      // Get user's own PAPS
      const papsResponse = await serv("paps.list", { 
        owner_username: currentUser.username,
        limit: 50 
      });
      const myPaps = papsResponse.paps || [];
      
      // Fetch applications for each owned PAPS
      const allApplications: ReceivedApplication[] = [];
      await Promise.all(
        myPaps.map(async (pap: { id: string; owner_id: string; title?: string }) => {
          try {
            const appsResponse = await serv("spap.listByPaps", { paps_id: pap.id });
            const apps = (appsResponse.applications || []).map((app: SpapDetail) => ({
              ...app,
              paps_id: pap.id,
              paps_owner_id: pap.owner_id,
              paps_title: app.paps_title ?? pap.title ?? "Untitled",
            }));
            allApplications.push(...apps);
          } catch {
            // Skip if we can't fetch applications for a specific PAPS
          }
        })
      );
      
      // Sort by created_at descending
      allApplications.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setSpaps(allApplications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load received applications");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [setSpaps, setLoading, setError]);

  // Accept an application - returns the new asap_id
  const acceptSpap = useCallback(async (spapId: string): Promise<string | null> => {
    const response = await serv("spap.accept", { spap_id: spapId });
    // Force refresh to get updated data
    fetchReceivedSpaps(true);
    return response?.asap_id || null;
  }, [fetchReceivedSpaps]);

  // Reject an application
  const rejectSpap = useCallback(async (spapId: string) => {
    const response = await serv("spap.reject", { spap_id: spapId });
    // Remove the deleted chat thread from cache
    if (response?.deleted_thread_id) {
      removeThreadFromCacheImperative(response.deleted_thread_id);
    }
    // Force refresh to get updated data
    fetchReceivedSpaps(true);
  }, [fetchReceivedSpaps]);

  return { 
    spaps, 
    loading, 
    error, 
    fetchReceivedSpaps, 
    acceptSpap, 
    rejectSpap 
  };
};

// Hook for pending received applications
export const usePendingReceivedSpaps = () => {
  const { loading, error, fetchReceivedSpaps, acceptSpap, rejectSpap } = useReceivedSpaps();
  const pending = useAtomValue(pendingReceivedSpapsAtom);
  return { spaps: pending, loading, error, refresh: fetchReceivedSpaps, acceptSpap, rejectSpap };
};

// =============================================================================
// ACTION HELPERS
// =============================================================================

// Withdraw an application
export const withdrawSpap = async (
  spapId: string,
  removeFromCache: (id: string) => void
): Promise<void> => {
  const response = await serv("spap.withdraw", { spap_id: spapId });
  // Remove the deleted chat thread from cache
  if (response?.deleted_thread_id) {
    removeThreadFromCacheImperative(response.deleted_thread_id);
  }
  removeFromCache(spapId);
};

// Apply to a paps
export const applyToJob = async (
  papsId: string,
  data: { message?: string; title?: string; subtitle?: string; proposed_payment?: number },
  _addToCache?: (spap: Spap) => void
): Promise<{ spap_id: string; chat_thread_id: string }> => {
  const response = await serv("spap.apply", { paps_id: papsId, ...data });
  // Note: To add to cache, caller should refetch spaps since API only returns IDs
  return response;
};
