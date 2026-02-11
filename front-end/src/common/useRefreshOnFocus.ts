/**
 * useRefreshOnFocus - Auto-refresh data when screen comes into focus
 * 
 * This hook uses React Navigation's useFocusEffect to refresh data
 * whenever the screen becomes focused (e.g., tab switch, back navigation).
 * 
 * @module common/useRefreshOnFocus
 */

import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook to automatically refresh data when screen comes into focus
 * 
 * @param refreshFn - Function to call when screen is focused (should be stable/memoized)
 * @param options - Configuration options
 * @param options.skipFirstFocus - If true, skip the first focus (useful when data is already loaded on mount)
 * @param options.minInterval - Minimum interval between refreshes in ms (default: 5000)
 * 
 * @example
 * // Basic usage
 * const { refresh } = useChats();
 * useRefreshOnFocus(refresh);
 * 
 * @example
 * // Skip first focus (data already loaded on mount)
 * const { fetchPaps } = usePaps();
 * useRefreshOnFocus(fetchPaps, { skipFirstFocus: true });
 */
export function useRefreshOnFocus(
  refreshFn: () => void | Promise<void>,
  options?: {
    skipFirstFocus?: boolean;
    minInterval?: number;
  }
) {
  const { skipFirstFocus = false, minInterval = 5000 } = options || {};
  
  const isFirstFocus = useRef(true);
  const lastRefreshTime = useRef(0);

  useFocusEffect(
    useCallback(() => {
      // Skip first focus if configured
      if (skipFirstFocus && isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      isFirstFocus.current = false;

      // Throttle refreshes
      const now = Date.now();
      if (now - lastRefreshTime.current < minInterval) {
        console.log('[useRefreshOnFocus] Skipping refresh (too soon)');
        return;
      }

      lastRefreshTime.current = now;
      console.log('[useRefreshOnFocus] Triggering refresh');
      refreshFn();
    }, [refreshFn, skipFirstFocus, minInterval])
  );
}

/**
 * Hook that provides both the refresh callback and focus-based auto-refresh
 * 
 * @param fetchFn - The fetch function from your cache hook
 * @returns Object with refresh function and loading state utilities
 * 
 * @example
 * const { refresh, forceRefresh } = useAutoRefresh(fetchChats);
 */
export function useAutoRefresh(fetchFn: (force?: boolean) => void | Promise<void>) {
  const lastRefreshTime = useRef(0);
  const MIN_INTERVAL = 5000; // 5 seconds

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_INTERVAL) {
      return;
    }
    lastRefreshTime.current = now;
    await fetchFn(false);
  }, [fetchFn]);

  const forceRefresh = useCallback(async () => {
    lastRefreshTime.current = Date.now();
    await fetchFn(true);
  }, [fetchFn]);

  // Auto-refresh on focus
  useRefreshOnFocus(refresh);

  return { refresh, forceRefresh };
}

export default useRefreshOnFocus;
