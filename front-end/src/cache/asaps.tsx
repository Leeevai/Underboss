import { useCallback } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import type { Asap, AsapDetail, AsapMyResponse, AsapMediaListResponse } from "../serve/asap";
import type { AsapStatus, MediaItem } from "../serve/common/types";
import { serv } from "../serve/serv";

// =============================================================================
// EXTENDED TYPE WITH MEDIA
// =============================================================================

export interface AsapWithMedia extends Asap {
  media?: MediaItem[];
  mediaLoaded?: boolean;
}

// =============================================================================
// BASE ATOMS - stores ASAPs by role
// =============================================================================

// ASAPs where I'm the worker (under_worker)
const asWorkerAtom = atom<AsapWithMedia[]>([]);
const asWorkerLoadingAtom = atom<boolean>(false);
const asWorkerErrorAtom = atom<string | null>(null);

// ASAPs where I'm the boss/owner (underboss)
const asOwnerAtom = atom<AsapWithMedia[]>([]);
const asOwnerLoadingAtom = atom<boolean>(false);
const asOwnerErrorAtom = atom<string | null>(null);

// Combined loading state
const asapsLoadingAtom = atom<boolean>(false);

// =============================================================================
// DERIVED ATOMS - filtered views by status
// =============================================================================

// Active worker ASAPs
export const activeAsWorkerAtom = atom((get) => {
  const asaps = get(asWorkerAtom);
  return asaps.filter((a) => a.status === "active" || a.status === "in_progress");
});

// Completed worker ASAPs
export const completedAsWorkerAtom = atom((get) => {
  const asaps = get(asWorkerAtom);
  return asaps.filter((a) => a.status === "completed");
});

// Active owner ASAPs
export const activeAsOwnerAtom = atom((get) => {
  const asaps = get(asOwnerAtom);
  return asaps.filter((a) => a.status === "active" || a.status === "in_progress");
});

// Completed owner ASAPs
export const completedAsOwnerAtom = atom((get) => {
  const asaps = get(asOwnerAtom);
  return asaps.filter((a) => a.status === "completed");
});

// All ASAPs combined (for calendar view)
export const allAsapsAtom = atom((get) => {
  const asWorker = get(asWorkerAtom);
  const asOwner = get(asOwnerAtom);
  return [...asWorker, ...asOwner].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
});

// ASAPs by date (for calendar) - returns a Map of date string to ASAPs
export const asapsByDateAtom = atom((get) => {
  const allAsaps = get(allAsapsAtom);
  const byDate = new Map<string, AsapWithMedia[]>();
  
  allAsaps.forEach((asap) => {
    // Use created_at date as the calendar date, skip if undefined
    if (!asap.created_at) return;
    const dateStr = asap.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = byDate.get(dateStr) || [];
    byDate.set(dateStr, [...existing, asap]);
  });
  
  return byDate;
});

// Get dates that have ASAPs (for calendar marking)
export const asapDatesAtom = atom((get) => {
  const byDate = get(asapsByDateAtom);
  return Array.from(byDate.keys());
});

// =============================================================================
// HOOKS
// =============================================================================

// Main hook to fetch all ASAPs
export const useAsaps = () => {
  const [asWorker, setAsWorker] = useAtom(asWorkerAtom);
  const [asOwner, setAsOwner] = useAtom(asOwnerAtom);
  const [loading, setLoading] = useAtom(asapsLoadingAtom);
  const [workerLoading, setWorkerLoading] = useAtom(asWorkerLoadingAtom);
  const [ownerLoading, setOwnerLoading] = useAtom(asOwnerLoadingAtom);
  const [workerError, setWorkerError] = useAtom(asWorkerErrorAtom);
  const [ownerError, setOwnerError] = useAtom(asOwnerErrorAtom);

  const fetchAsaps = useCallback(async (forceRefresh = false) => {
    if (loading && !forceRefresh) return;
    setLoading(true);
    setWorkerLoading(true);
    setOwnerLoading(true);
    setWorkerError(null);
    setOwnerError(null);
    
    try {
      const response: AsapMyResponse = await serv("asap.my");
      setAsWorker(response.as_worker || []);
      setAsOwner(response.as_owner || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load assignments";
      setWorkerError(message);
      setOwnerError(message);
    } finally {
      setLoading(false);
      setWorkerLoading(false);
      setOwnerLoading(false);
    }
  }, [loading, setAsWorker, setAsOwner, setLoading, setWorkerLoading, setOwnerLoading, setWorkerError, setOwnerError]);

  // Fetch media for a specific ASAP
  const fetchAsapMedia = useCallback(async (asapId: string) => {
    try {
      const response: AsapMediaListResponse = await serv("asap.media.list", { asap_id: asapId });
      
      // Update the ASAP with media in both arrays
      const updateWithMedia = (asaps: AsapWithMedia[]) =>
        asaps.map((a) =>
          a.asap_id === asapId
            ? { ...a, media: response.media || [], mediaLoaded: true }
            : a
        );
      
      setAsWorker(updateWithMedia);
      setAsOwner(updateWithMedia);
      
      return response.media || [];
    } catch (err) {
      console.error("Failed to fetch ASAP media:", err);
      return [];
    }
  }, [setAsWorker, setAsOwner]);

  // Update status of an ASAP
  const updateStatus = useCallback(async (asapId: string, status: AsapStatus) => {
    try {
      await serv("asap.updateStatus", { asap_id: asapId, status });
      
      // Update in cache
      const applyStatusUpdate = (asaps: AsapWithMedia[]) =>
        asaps.map((a) => (a.asap_id === asapId ? { ...a, status } : a));
      
      setAsWorker(applyStatusUpdate);
      setAsOwner(applyStatusUpdate);
    } catch (err) {
      throw err;
    }
  }, [setAsWorker, setAsOwner]);

  // Remove an ASAP from cache
  const removeAsap = useCallback((asapId: string) => {
    setAsWorker((prev) => prev.filter((a) => a.asap_id !== asapId));
    setAsOwner((prev) => prev.filter((a) => a.asap_id !== asapId));
  }, [setAsWorker, setAsOwner]);

  return {
    asWorker,
    asOwner,
    loading,
    workerLoading,
    ownerLoading,
    workerError,
    ownerError,
    fetchAsaps,
    fetchAsapMedia,
    updateStatus,
    removeAsap,
  };
};

// Hook for worker ASAPs (under_worker - I'm working for someone)
export const useAsWorker = () => {
  const { asWorker, workerLoading, workerError, fetchAsaps, fetchAsapMedia, updateStatus } = useAsaps();
  const active = useAtomValue(activeAsWorkerAtom);
  const completed = useAtomValue(completedAsWorkerAtom);
  
  return {
    asaps: asWorker,
    active,
    completed,
    loading: workerLoading,
    error: workerError,
    refresh: fetchAsaps,
    fetchMedia: fetchAsapMedia,
    updateStatus,
  };
};

// Hook for owner ASAPs (underboss - I hired someone)
export const useAsOwner = () => {
  const { asOwner, ownerLoading, ownerError, fetchAsaps, fetchAsapMedia, updateStatus } = useAsaps();
  const active = useAtomValue(activeAsOwnerAtom);
  const completed = useAtomValue(completedAsOwnerAtom);
  
  return {
    asaps: asOwner,
    active,
    completed,
    loading: ownerLoading,
    error: ownerError,
    refresh: fetchAsaps,
    fetchMedia: fetchAsapMedia,
    updateStatus,
  };
};

// Hook for calendar view - ASAPs organized by date
export const useAsapCalendar = () => {
  const { loading, workerError, ownerError, fetchAsaps, fetchAsapMedia } = useAsaps();
  const allAsaps = useAtomValue(allAsapsAtom);
  const byDate = useAtomValue(asapsByDateAtom);
  const dates = useAtomValue(asapDatesAtom);
  const asWorker = useAtomValue(asWorkerAtom);
  const asOwner = useAtomValue(asOwnerAtom);
  
  // Get ASAPs for a specific date
  const getAsapsForDate = useCallback((dateStr: string): AsapWithMedia[] => {
    return byDate.get(dateStr) || [];
  }, [byDate]);
  
  // Check if an ASAP is "as worker" or "as owner"
  const getAsapRole = useCallback((asapId: string): 'worker' | 'owner' | null => {
    if (asWorker.some((a) => a.asap_id === asapId)) return 'worker';
    if (asOwner.some((a) => a.asap_id === asapId)) return 'owner';
    return null;
  }, [asWorker, asOwner]);
  
  // Get marked dates for calendar (dates with ASAPs)
  const getMarkedDates = useCallback(() => {
    const marked: Record<string, { marked: boolean; dotColor: string; dots?: { color: string }[] }> = {};
    
    dates.forEach((dateStr) => {
      const asaps = byDate.get(dateStr) || [];
      const hasWorker = asaps.some((a) => asWorker.some((w) => w.asap_id === a.asap_id));
      const hasOwner = asaps.some((a) => asOwner.some((o) => o.asap_id === a.asap_id));
      
      // Use dots to indicate both types
      const dots: { color: string }[] = [];
      if (hasWorker) dots.push({ color: '#38A169' }); // Green for worker
      if (hasOwner) dots.push({ color: '#5A67D8' }); // Purple for owner
      
      marked[dateStr] = {
        marked: true,
        dotColor: hasOwner ? '#5A67D8' : '#38A169',
        dots,
      };
    });
    
    return marked;
  }, [dates, byDate, asWorker, asOwner]);
  
  return {
    allAsaps,
    asWorker,
    asOwner,
    loading,
    error: workerError || ownerError,
    refresh: fetchAsaps,
    fetchMedia: fetchAsapMedia,
    getAsapsForDate,
    getAsapRole,
    getMarkedDates,
    dates,
  };
};

// =============================================================================
// STANDALONE FUNCTIONS
// =============================================================================

// Rate a user after completing an ASAP
export const rateAsap = async (asapId: string, score: number) => {
  return await serv("asap.rate", { asap_id: asapId, score });
};

// Check if current user can rate
export const canRateAsap = async (asapId: string) => {
  return await serv("asap.canRate", { asap_id: asapId });
};

// Get ASAP details
export const getAsapDetail = async (asapId: string): Promise<AsapDetail> => {
  return await serv("asap.get", { asap_id: asapId });
};
