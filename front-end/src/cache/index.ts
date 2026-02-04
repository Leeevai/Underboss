/**
 * Cache - Centralized Jotai-based state management
 * 
 * Re-exports all cache modules for convenient importing:
 * import { usePaps, useCategories, useProfile } from '../cache';
 */

// Paps cache
export {
  featuredPapsAtom,
  newestPapsAtom,
  nearbyPapsAtom,
  recommendedPapsAtom,
  usePaps,
  useFeaturedPaps,
  useNewestPaps,
  useNearbyPaps,
  useRecommendedPaps,
} from './paps';

// Categories cache
export {
  activeCategoriesAtom,
  sortedCategoriesAtom,
  rootCategoriesAtom,
  categoryMapAtom,
  childCategoriesAtom,
  useCategories,
  useActiveCategories,
  useRootCategories,
  useCategoryById,
  useChildCategories,
  getCategoryColor,
  getCategoryColorByName,
} from './categories';
export type { CategoryColor } from './categories';

// Profiles cache
export {
  profileByUsernameAtom,
  avatarByUsernameAtom,
  useProfileCache,
  useProfile,
  useAvatarUrl,
} from './profiles';
