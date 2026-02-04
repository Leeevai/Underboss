import { useCallback, useEffect, useState } from "react";
import { atom, useAtom } from "jotai";
import { UserProfile } from "../serve/profile/types";
import { serv, getMediaUrl } from "../serve";

// =============================================================================
// BASE ATOMS - Map of username -> UserProfile
// =============================================================================

/** Map of username to profile - the main cache */
const profileMapAtom = atom<Map<string, UserProfile>>(new Map<string, UserProfile>());

/** Set of usernames currently being fetched (to avoid duplicate requests) */
const fetchingUsernamesAtom = atom<Set<string>>(new Set<string>());

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
  const [fetchingUsernames, setFetchingUsernames] = useAtom(fetchingUsernamesAtom);

  /**
   * Fetch a profile by username if not already cached
   */
  const fetchProfile = useCallback(async (username: string): Promise<UserProfile | null> => {
    // Already cached
    const cached = profileMap.get(username);
    if (cached) return cached;

    // Already fetching
    if (fetchingUsernames.has(username)) return null;

    // Mark as fetching
    setFetchingUsernames((prev: Set<string>) => new Set(prev).add(username));

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
      // Remove from fetching set
      setFetchingUsernames((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  }, [profileMap, fetchingUsernames, setProfileMap, setFetchingUsernames]);

  /**
   * Batch fetch multiple profiles at once
   */
  const fetchProfiles = useCallback(async (usernames: string[]): Promise<void> => {
    const toFetch = usernames.filter(u => !profileMap.has(u) && !fetchingUsernames.has(u));
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
  }, [profileMap, fetchingUsernames, setProfileMap, setFetchingUsernames]);

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
  const { fetchProfile, getProfile, getAvatarUrl } = useProfileCache();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    
    const cached = getProfile(username);
    if (cached) return;

    setLoading(true);
    fetchProfile(username).finally(() => setLoading(false));
  }, [username, getProfile, fetchProfile]);

  const profile = username ? getProfile(username) : undefined;
  const avatarUrl = username ? getAvatarUrl(username) : null;

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
