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

// Spaps cache (applications)
export {
  // My applications
  pendingSpapsAtom,
  acceptedSpapsAtom,
  rejectedSpapsAtom,
  withdrawnSpapsAtom,
  activeSpapsAtom,
  recentSpapsAtom,
  useSpaps,
  usePendingSpaps,
  useAcceptedSpaps,
  useActiveSpaps,
  useRecentSpaps,
  withdrawSpap,
  applyToJob,
  // Received applications (on our PAPS)
  pendingReceivedSpapsAtom,
  acceptedReceivedSpapsAtom,
  rejectedReceivedSpapsAtom,
  useReceivedSpaps,
  usePendingReceivedSpaps,
} from './spaps';
export type { ReceivedApplication } from './spaps';

// Asaps cache (assignments)
export {
  // Derived atoms
  activeAsWorkerAtom,
  completedAsWorkerAtom,
  activeAsOwnerAtom,
  completedAsOwnerAtom,
  allAsapsAtom,
  asapsByDateAtom,
  asapDatesAtom,
  // Hooks
  useAsaps,
  useAsWorker,
  useAsOwner,
  useAsapCalendar,
  // Functions
  rateAsap,
  canRateAsap,
  getAsapDetail,
} from './asaps';
export type { AsapWithMedia } from './asaps';

// Chats cache (messaging)
export {
  // Derived atoms
  unreadThreadsAtom,
  sortedThreadsAtom,
  spapThreadsAtom,
  asapThreadsAtom,
  groupThreadsAtom,
  // Hooks
  useChats,
  useSortedChats,
  useUnreadChats,
  useChatMessages,
  // Functions
  getUnreadCount,
  getThreadDetails,
} from './chats';
