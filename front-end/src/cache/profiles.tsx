import { useCallback, useEffect, useState, useRef } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { UserProfile } from "../serve/profile/types";
import { serv, getMediaUrl } from "../serve";

// =============================================================================
// BASE ATOMS - Map of username -> UserProfile
// =============================================================================

/** Map of username to profile - the main cache */
const profileMapAtom = atom<Map<string, UserProfile>>(new Map<string, UserProfile>());

/** Set of usernames currently being fetched (to avoid duplicate requests) */
const fetchingUsernamesAtom = atom<Set<string>>(new Set<string>());

// Module-level in-flight request tracker to prevent duplicate calls across hook instances
const inFlightRequests = new Map<string, Promise<UserProfile | null | void>>();

// =============================================================================
// DERIVED ATOMS
// =============================================================================

/** Get a profile by username from cache */
export const profileByUsernameAtom = atom(
  (get) => (username: string) => get(profileMapAtom).get(username)
);

/** Get avatar URL by username from cache */
export const avatarByUsernameAtom = atom(
  (get) => (username: string) => {
    const profile = get(profileMapAtom).get(username);
    return profile?.avatar_url ? getMediaUrl(profile.avatar_url) : null;
  }
);

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the profile cache and fetch profiles
 */
export const useProfileCache = () => {
  const [profileMap, setProfileMap] = useAtom(profileMapAtom);
  const [, setFetchingUsernames] = useAtom(fetchingUsernamesAtom);

  /**
   * Fetch a profile by username if not already cached or in-flight
   */
  const fetchProfile = useCallback(async (username: string): Promise<UserProfile | null> => {
    // Check cache first (using functional access to avoid stale closure)
    const cached = profileMap.get(username);
    if (cached) return cached;

    // Check if already in-flight (module-level deduplication)
    const existingRequest = inFlightRequests.get(username);
    if (existingRequest) {
      // Wait for existing request and then return from cache
      await existingRequest;
      return profileMap.get(username) || null;
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const profile = await serv('profile.getByUsername', { username });
        
        // Update cache
        setProfileMap(prev => {
          const newMap = new Map(prev);
          newMap.set(username, profile);
          return newMap;
        });

        return profile;
      } catch (err) {
        console.warn(`Failed to fetch profile for ${username}:`, err);
        return null;
      } finally {
        // Remove from in-flight map
        inFlightRequests.delete(username);
      }
    })();

    // Store the promise for deduplication
    inFlightRequests.set(username, fetchPromise);

    return fetchPromise;
  }, [profileMap, setProfileMap]);

  /**
   * Batch fetch multiple profiles at once
   */
  const fetchProfiles = useCallback(async (usernames: string[]): Promise<void> => {
    const toFetch = usernames.filter(u => 
      !profileMap.has(u) && !inFlightRequests.has(u)
    );
    if (toFetch.length === 0) return;

    // Mark all as fetching
    setFetchingUsernames((prev: Set<string>) => {
      const newSet = new Set(prev);
      toFetch.forEach(u => newSet.add(u));
      return newSet;
    });

    // Fetch all in parallel
    const results = await Promise.allSettled(
      toFetch.map(username => 
        serv('profile.getByUsername', { username })
          .then(profile => ({ username, profile }))
      )
    );

    // Update cache with successful results
    setProfileMap(prev => {
      const newMap = new Map(prev);
      for (const result of results) {
        if (result.status === 'fulfilled') {
          newMap.set(result.value.username, result.value.profile);
        }
      }
      return newMap;
    });

    // Clear fetching set
    setFetchingUsernames((prev: Set<string>) => {
      const newSet = new Set(prev);
      toFetch.forEach(u => newSet.delete(u));
      return newSet;
    });
  }, [profileMap, setProfileMap, setFetchingUsernames]);

  /**
   * Get a cached profile (does not fetch)
   */
  const getProfile = useCallback((username: string): UserProfile | undefined => {
    return profileMap.get(username);
  }, [profileMap]);

  /**
   * Get avatar URL from cached profile
   */
  const getAvatarUrl = useCallback((username: string): string | null => {
    const profile = profileMap.get(username);
    return profile?.avatar_url ? getMediaUrl(profile.avatar_url) : null;
  }, [profileMap]);

  /**
   * Clear the cache
   */
  const clearCache = useCallback(() => {
    setProfileMap(new Map());
  }, [setProfileMap]);

  return {
    profileMap,
    fetchProfile,
    fetchProfiles,
    getProfile,
    getAvatarUrl,
    clearCache,
  };
};

/**
 * Hook to get a single profile by username
 * Auto-fetches if not cached
 */
export const useProfile = (username: string | undefined) => {
  const profileMap = useAtomValue(profileMapAtom);
  const [, setProfileMap] = useAtom(profileMapAtom);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!username) return;
    
    // Already cached
    if (profileMap.has(username)) return;
    
    // Already fetched or in-flight (use ref to track across renders)
    if (fetchedRef.current.has(username) || inFlightRequests.has(username)) return;
    
    // Mark as fetched to prevent duplicate calls
    fetchedRef.current.add(username);

    const fetchPromise = (async () => {
      setLoading(true);
      try {
        const profile = await serv('profile.getByUsername', { username });
        setProfileMap(prev => {
          const newMap = new Map(prev);
          newMap.set(username, profile);
          return newMap;
        });
      } catch (err) {
        console.warn(`Failed to fetch profile for ${username}:`, err);
      } finally {
        setLoading(false);
        inFlightRequests.delete(username);
      }
    })();

    inFlightRequests.set(username, fetchPromise);
  // Only depend on username - we check profileMap.has() inside the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const profile = username ? profileMap.get(username) : undefined;
  const avatarUrl = profile?.avatar_url ? getMediaUrl(profile.avatar_url) : null;

  return { profile, avatarUrl, loading };
};

/**
 * Hook to get avatar URL for a username
 * Auto-fetches profile if not cached
 */
export const useAvatarUrl = (username: string | undefined) => {
  const { avatarUrl, loading } = useProfile(username);
  return { avatarUrl, loading };
};
