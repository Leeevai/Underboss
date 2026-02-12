import React, { useCallback } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { Paps } from "../serve/paps";
import { serv } from "../serve/serv";

// =============================================================================
// BASE ATOMS - stores all paps and loading state
// =============================================================================

const papsAtom = atom<Paps[]>([]);
const papsLoadingAtom = atom<boolean>(false);
const papsErrorAtom = atom<string | null>(null);

// =============================================================================
// DERIVED ATOMS - different views of the same data
// =============================================================================

// Featured: sorted by payment amount (highest first)
export const featuredPapsAtom = atom((get) => {
  const paps = get(papsAtom);
  return [...paps]
    .sort((a, b) => (b.payment_amount || 0) - (a.payment_amount || 0))
    .slice(0, 5);
});

// Newest: sorted by created_at (most recent first)
export const newestPapsAtom = atom((get) => {
  const paps = get(papsAtom);
  return [...paps]
    .sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, 10);
});

// Nearby: only paps with location data (no limit - show all on map)
export const nearbyPapsAtom = atom((get) => {
  const paps = get(papsAtom);
  return paps
    .filter((p) => p.location_lat && p.location_lng);
});

// Recommended: shuffled selection
export const recommendedPapsAtom = atom((get) => {
  const paps = get(papsAtom);
  // Use a seeded shuffle based on current hour to avoid re-shuffle on every render
  const seed = new Date().getHours();
  return [...paps]
    .sort((a, b) => {
      const hashA = ((a.id || '').toString().charCodeAt(0) + seed) % 100;
      const hashB = ((b.id || '').toString().charCodeAt(0) + seed) % 100;
      return hashA - hashB;
    })
    .slice(0, 10);
});

// =============================================================================
// HOOKS
// =============================================================================

// Main hook to fetch and manage paps
export const usePaps = () => {
  const [paps, setPaps] = useAtom(papsAtom);
  const [loading, setLoading] = useAtom(papsLoadingAtom);
  const [error, setError] = useAtom(papsErrorAtom);

  const fetchPaps = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await serv('paps.list', { status: 'published' });
      setPaps(response.paps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [loading, setPaps, setLoading, setError]);

  // Auto-fetch on first use
  React.useEffect(() => {
    if (paps.length === 0 && !loading && !error) {
      fetchPaps();
    }
  }, [paps.length, loading, error, fetchPaps]);

  return { paps, loading, error, fetchPaps, setPaps };
};

// Hook for featured paps
export const useFeaturedPaps = () => {
  const { loading, error, fetchPaps } = usePaps();
  const featured = useAtomValue(featuredPapsAtom);
  return { paps: featured, loading, error, refresh: fetchPaps };
};

// Hook for newest paps
export const useNewestPaps = () => {
  const { loading, error, fetchPaps } = usePaps();
  const newest = useAtomValue(newestPapsAtom);
  return { paps: newest, loading, error, refresh: fetchPaps };
};

// Hook for nearby paps
export const useNearbyPaps = () => {
  const { loading, error, fetchPaps } = usePaps();
  const nearby = useAtomValue(nearbyPapsAtom);
  return { paps: nearby, loading, error, refresh: fetchPaps };
};

// Hook for recommended paps
export const useRecommendedPaps = () => {
  const { loading, error, fetchPaps } = usePaps();
  const recommended = useAtomValue(recommendedPapsAtom);
  return { paps: recommended, loading, error, refresh: fetchPaps };
};
