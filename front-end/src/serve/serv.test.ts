/**
 * serv.test.ts - Comprehensive test file showing ALL serv() usages
 * 
 * This file demonstrates every possible endpoint call with proper typing.
 * Use this as a reference for how to call any API endpoint.
 * 
 * NOTE: This is a reference file, not meant to be run directly.
 * Each function shows how to use a specific endpoint.
 */

import { serv, ApiError, isAuthenticated, clearAuth, getCurrentUser, getCachedProfile } from './index';

// =============================================================================
// SAMPLE DATA (UUIDs and test values)
// =============================================================================

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const SAMPLE_PAPS_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SAMPLE_CATEGORY_ID = 'cat12345-6789-abcd-ef01-234567890abc';
const SAMPLE_COMMENT_ID = 'com12345-6789-abcd-ef01-234567890abc';
const SAMPLE_SPAP_ID = 'spap1234-5678-90ab-cdef-1234567890ab';
const SAMPLE_MEDIA_ID = 'med12345-6789-abcd-ef01-234567890abc';
const SAMPLE_EXP_ID = 'exp12345-6789-abcd-ef01-234567890abc';
const SAMPLE_USER_ID = 'usr12345-6789-abcd-ef01-234567890abc';

// Sample file for uploads
const sampleFile = new Blob(['test'], { type: 'image/png' });
const sampleFiles = [new Blob(['test1'], { type: 'image/png' }), new Blob(['test2'], { type: 'image/png' })];

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

/** Register a new user */
async function testRegister() {
  const result = await serv('register', {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securePassword123',
    phone: '+1234567890', // optional
  });
  console.log('Registered user ID:', result.userId);
}

/** Login - returns UserInfo and auto-saves token */
async function testLogin() {
  const user = await serv('login', {
    login: 'john_doe', // can be username, email, or phone
    password: 'securePassword123',
  });
  console.log('Logged in as:', user.username);
  console.log('User ID:', user.userId);
  console.log('Is Admin:', user.isAdmin);
}

/** Get current username (simple auth check) */
async function testWhoAmI() {
  const result = await serv('whoami');
  console.log('Current user:', result.username);
}

/** Get current user info - returns UserInfo (no password hash) */
async function testMyself() {
  const user = await serv('myself');
  console.log('User info:', user);
}

// =============================================================================
// PROFILE ENDPOINTS
// =============================================================================

/** Get current user's profile */
async function testProfileGet() {
  const profile = await serv('profile.get');
  console.log('Profile:', profile);
}

/** Update current user's profile */
async function testProfileUpdate() {
  const updatedProfile = await serv('profile.update', {
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'Johnny D',
    bio: 'Software developer from NYC',
    date_of_birth: '1990-05-15',
    location_address: '123 Main St, New York, NY',
    location_lat: 40.7128,
    location_lng: -74.0060,
    timezone: 'America/New_York',
    preferred_language: 'en',
  });
  console.log('Updated profile:', updatedProfile);
}

/** Get another user's profile by username */
async function testProfileGetByUsername() {
  const profile = await serv('profile.getByUsername', {
    username: 'jane_doe',
  });
  console.log('Jane profile:', profile);
}

/** Update another user's profile (admin) */
async function testProfileUpdateByUsername() {
  const updatedProfile = await serv('profile.updateByUsername', {
    username: 'jane_doe',
    bio: 'Updated bio by admin',
  });
  console.log('Updated:', updatedProfile);
}

// =============================================================================
// AVATAR ENDPOINTS
// =============================================================================

/** Upload avatar */
async function testAvatarUpload() {
  const result = await serv('avatar.upload', {
    file: sampleFile,
  });
  console.log('Avatar URL:', result.avatar_url);
}

/** Get current user's avatar (returns Blob) */
async function testAvatarGet() {
  const blob = await serv('avatar.get');
  console.log('Avatar blob size:', blob.size);
}

/** Delete current user's avatar */
async function testAvatarDelete() {
  await serv('avatar.delete');
  console.log('Avatar deleted');
}

/** Get another user's avatar */
async function testAvatarGetByUsername() {
  const blob = await serv('avatar.getByUsername', {
    username: 'jane_doe',
  });
  console.log('Jane avatar size:', blob.size);
}

// =============================================================================
// EXPERIENCES ENDPOINTS
// =============================================================================

/** List current user's experiences */
async function testExperiencesList() {
  const experiences = await serv('experiences.list');
  console.log('Experiences:', experiences);
}

/** Create a new experience */
async function testExperiencesCreate() {
  const result = await serv('experiences.create', {
    title: 'Senior Developer',
    company: 'Tech Corp',
    description: 'Building awesome products',
    start_date: '2020-01-15T00:00:00Z',
    end_date: '2023-06-30T00:00:00Z',
    is_current: false,
  });
  console.log('Created experience ID:', result.experience_id);
}

/** Update an experience */
async function testExperiencesUpdate() {
  const updated = await serv('experiences.update', {
    exp_id: SAMPLE_EXP_ID,
    title: 'Lead Developer',
    is_current: true,
  });
  console.log('Updated experience:', updated);
}

/** Delete an experience */
async function testExperiencesDelete() {
  await serv('experiences.delete', {
    exp_id: SAMPLE_EXP_ID,
  });
  console.log('Experience deleted');
}

/** List another user's experiences */
async function testExperiencesListByUsername() {
  const experiences = await serv('experiences.listByUsername', {
    username: 'jane_doe',
  });
  console.log('Jane experiences:', experiences);
}

// =============================================================================
// INTERESTS ENDPOINTS
// =============================================================================

/** List current user's interests */
async function testInterestsList() {
  const interests = await serv('interests.list');
  console.log('Interests:', interests);
}

/** Add an interest */
async function testInterestsCreate() {
  await serv('interests.create', {
    category_id: SAMPLE_CATEGORY_ID,
    proficiency_level: 4, // 1-5
  });
  console.log('Interest added');
}

/** Update interest proficiency */
async function testInterestsUpdate() {
  const updated = await serv('interests.update', {
    category_id: SAMPLE_CATEGORY_ID,
    proficiency_level: 5,
  });
  console.log('Updated interest:', updated);
}

/** Remove an interest */
async function testInterestsDelete() {
  await serv('interests.delete', {
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Interest removed');
}

/** List another user's interests */
async function testInterestsListByUsername() {
  const interests = await serv('interests.listByUsername', {
    username: 'jane_doe',
  });
  console.log('Jane interests:', interests);
}

// =============================================================================
// CATEGORIES ENDPOINTS
// =============================================================================

/** List all categories */
async function testCategoriesList() {
  const categories = await serv('categories.list');
  console.log('Categories:', categories);
}

/** Get a single category */
async function testCategoriesGet() {
  const category = await serv('categories.get', {
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Category:', category);
}

/** Create a category (admin only) */
async function testCategoriesCreate() {
  const result = await serv('categories.create', {
    name: 'Web Development',
    slug: 'web-development',
    description: 'All things web dev',
    parent_id: undefined, // optional - for subcategories
    icon_url: undefined, // optional
  });
  console.log('Created category ID:', result.category_id);
}

/** Update a category (admin only) */
async function testCategoriesUpdate() {
  const updated = await serv('categories.update', {
    category_id: SAMPLE_CATEGORY_ID,
    name: 'Full Stack Development',
    is_active: true,
  });
  console.log('Updated category:', updated);
}

/** Delete a category (admin only) */
async function testCategoriesDelete() {
  await serv('categories.delete', {
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Category deleted');
}

/** Upload category icon (admin only) */
async function testCategoriesIconUpload() {
  const result = await serv('categories.iconUpload', {
    category_id: SAMPLE_CATEGORY_ID,
    file: sampleFile,
  });
  console.log('Icon URL:', result.icon_url);
}

/** Get category icon */
async function testCategoriesIconGet() {
  const blob = await serv('categories.iconGet', {
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Icon blob size:', blob.size);
}

/** Delete category icon (admin only) */
async function testCategoriesIconDelete() {
  await serv('categories.iconDelete', {
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Icon deleted');
}

// =============================================================================
// PAPS (JOB POSTINGS) ENDPOINTS
// =============================================================================

/** List PAPS with optional filters */
async function testPapsList() {
  // No filters
  const allPaps = await serv('paps.list');
  console.log('All PAPS:', allPaps.paps, 'Total:', allPaps.total_count);

  // With filters
  const filteredPaps = await serv('paps.list', {
    status: 'published',
    category_id: SAMPLE_CATEGORY_ID,
    lat: 40.7128,
    lng: -74.0060,
    max_distance: 50, // km
    min_price: 100,
    max_price: 1000,
    payment_type: 'fixed',
    owner_username: 'john_doe',
    title_search: 'developer',
  });
  console.log('Filtered PAPS:', filteredPaps.paps);
}

/** Get a single PAPS with details */
async function testPapsGet() {
  const paps = await serv('paps.get', {
    paps_id: SAMPLE_PAPS_ID,
  });
  console.log('PAPS detail:', paps);
  console.log('Comments count:', paps.comments_count);
  console.log('Applications count:', paps.applications_count);
}

/** Create a new PAPS */
async function testPapsCreate() {
  const result = await serv('paps.create', {
    title: 'Need React Developer',
    description: 'Looking for an experienced React developer for a 2-week project.',
    payment_amount: 500,
    payment_currency: 'USD', // optional, defaults to USD
    payment_type: 'fixed', // 'fixed' | 'hourly' | 'negotiable'
    max_applicants: 10, // optional
    max_assignees: 1, // optional
    subtitle: 'Remote work available', // optional
    location_address: 'New York, NY', // optional
    location_lat: 40.7128, // optional
    location_lng: -74.0060, // optional
    location_timezone: 'America/New_York', // optional
    start_datetime: '2024-02-01T09:00:00Z', // optional
    end_datetime: '2024-02-15T17:00:00Z', // optional
    estimated_duration_minutes: 2400, // optional
    is_public: true, // optional
    status: 'draft', // 'draft' | 'published' | 'closed' | 'cancelled'
    categories: [ // optional
      { category_id: SAMPLE_CATEGORY_ID, is_primary: true },
    ],
  });
  console.log('Created PAPS ID:', result.paps_id);
}

/** Update a PAPS */
async function testPapsUpdate() {
  const updated = await serv('paps.update', {
    paps_id: SAMPLE_PAPS_ID,
    title: 'Need Senior React Developer',
    status: 'published',
    payment_amount: 750,
  });
  console.log('Updated PAPS:', updated);
}

/** Delete a PAPS */
async function testPapsDelete() {
  await serv('paps.delete', {
    paps_id: SAMPLE_PAPS_ID,
  });
  console.log('PAPS deleted');
}

/** Add a category to PAPS */
async function testPapsAddCategory() {
  await serv('paps.addCategory', {
    paps_id: SAMPLE_PAPS_ID,
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Category added to PAPS');
}

/** Remove a category from PAPS */
async function testPapsRemoveCategory() {
  await serv('paps.removeCategory', {
    paps_id: SAMPLE_PAPS_ID,
    category_id: SAMPLE_CATEGORY_ID,
  });
  console.log('Category removed from PAPS');
}

// =============================================================================
// PAPS MEDIA ENDPOINTS
// =============================================================================

/** List media for a PAPS */
async function testPapsMediaList() {
  const result = await serv('paps.media.list', {
    paps_id: SAMPLE_PAPS_ID,
  });
  console.log('Media count:', result.media_count);
  console.log('Media items:', result.media);
}

/** Upload media to a PAPS (multiple files) */
async function testPapsMediaUpload() {
  const result = await serv('paps.media.upload', {
    paps_id: SAMPLE_PAPS_ID,
    files: sampleFiles,
  });
  console.log('Uploaded:', result.count, 'files');
  console.log('Media:', result.uploaded_media);
}

/** Get a media file (returns Blob) */
async function testPapsMediaGet() {
  const blob = await serv('paps.media.get', {
    media_id: SAMPLE_MEDIA_ID,
  });
  console.log('Media blob size:', blob.size);
}

/** Delete a media file */
async function testPapsMediaDelete() {
  await serv('paps.media.delete', {
    media_id: SAMPLE_MEDIA_ID,
  });
  console.log('Media deleted');
}

// =============================================================================
// COMMENTS ENDPOINTS
// =============================================================================

/** List comments on a PAPS */
async function testCommentsList() {
  const result = await serv('comments.list', {
    paps_id: SAMPLE_PAPS_ID,
  });
  console.log('Comments:', result.comments);
  console.log('Count:', result.count, 'Total:', result.total_count);
}

/** Create a comment on a PAPS */
async function testCommentsCreate() {
  const result = await serv('comments.create', {
    paps_id: SAMPLE_PAPS_ID,
    content: 'This looks like a great opportunity!',
  });
  console.log('Created comment ID:', result.comment_id);
}

/** Get a single comment */
async function testCommentsGet() {
  const comment = await serv('comments.get', {
    comment_id: SAMPLE_COMMENT_ID,
  });
  console.log('Comment:', comment);
}

/** Update a comment */
async function testCommentsUpdate() {
  const updated = await serv('comments.update', {
    comment_id: SAMPLE_COMMENT_ID,
    content: 'Updated: This is an amazing opportunity!',
  });
  console.log('Updated comment:', updated);
}

/** Delete a comment */
async function testCommentsDelete() {
  await serv('comments.delete', {
    comment_id: SAMPLE_COMMENT_ID,
  });
  console.log('Comment deleted');
}

/** List replies to a comment */
async function testCommentsReplies() {
  const result = await serv('comments.replies', {
    comment_id: SAMPLE_COMMENT_ID,
  });
  console.log('Replies:', result.replies);
  console.log('Count:', result.count);
}

/** Reply to a comment */
async function testCommentsReply() {
  const result = await serv('comments.reply', {
    comment_id: SAMPLE_COMMENT_ID,
    content: 'Thanks for your interest!',
  });
  console.log('Reply ID:', result.comment_id);
}

/** Get comment thread (comment + all replies) */
async function testCommentsThread() {
  const result = await serv('comments.thread', {
    comment_id: SAMPLE_COMMENT_ID,
  });
  console.log('Main comment:', result.comment);
  console.log('Replies:', result.replies);
  console.log('Is reply:', result.is_reply);
}

// =============================================================================
// SPAP (APPLICATIONS) ENDPOINTS
// =============================================================================

/** List applications for a PAPS (owner only) */
async function testSpapListForPaps() {
  const result = await serv('spap.listForPaps', {
    paps_id: SAMPLE_PAPS_ID,
  });
  console.log('Applications:', result.applications);
  console.log('Count:', result.count);
}

/** List my applications */
async function testSpapMy() {
  const result = await serv('spap.my');
  console.log('My applications:', result.applications);
  console.log('Count:', result.count);
}

/** Apply to a PAPS */
async function testSpapApply() {
  const result = await serv('spap.apply', {
    paps_id: SAMPLE_PAPS_ID,
    message: 'I would love to work on this project!', // optional
  });
  console.log('Application ID:', result.spap_id);
}

/** Get a single application */
async function testSpapGet() {
  const spap = await serv('spap.get', {
    spap_id: SAMPLE_SPAP_ID,
  });
  console.log('Application:', spap);
}

/** Withdraw an application */
async function testSpapWithdraw() {
  await serv('spap.withdraw', {
    spap_id: SAMPLE_SPAP_ID,
  });
  console.log('Application withdrawn');
}

/** Update application status (owner only) */
async function testSpapUpdateStatus() {
  const updated = await serv('spap.updateStatus', {
    spap_id: SAMPLE_SPAP_ID,
    status: 'accepted', // 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  });
  console.log('Updated application:', updated);
}

// =============================================================================
// SPAP MEDIA ENDPOINTS
// =============================================================================

/** List media for an application */
async function testSpapMediaList() {
  const result = await serv('spap.media.list', {
    spap_id: SAMPLE_SPAP_ID,
  });
  console.log('Media count:', result.media_count);
  console.log('Media items:', result.media);
}

/** Upload media to an application */
async function testSpapMediaUpload() {
  const result = await serv('spap.media.upload', {
    spap_id: SAMPLE_SPAP_ID,
    files: sampleFiles,
  });
  console.log('Uploaded:', result.count, 'files');
}

/** Get application media (returns Blob) */
async function testSpapMediaGet() {
  const blob = await serv('spap.media.get', {
    media_id: SAMPLE_MEDIA_ID,
  });
  console.log('Media blob size:', blob.size);
}

/** Delete application media */
async function testSpapMediaDelete() {
  await serv('spap.media.delete', {
    media_id: SAMPLE_MEDIA_ID,
  });
  console.log('Media deleted');
}

// =============================================================================
// SYSTEM ENDPOINTS
// =============================================================================

/** Get server uptime (no auth required) */
async function testSystemUptime() {
  const result = await serv('system.uptime');
  console.log('App:', result.app);
  console.log('Uptime:', result.up);
}

/** Get system info (admin only) */
async function testSystemInfo() {
  const result = await serv('system.info');
  console.log('App:', result.app);
  console.log('Git:', result.git);
  console.log('DB:', result.db);
  console.log('Status:', result.status);
}

/** Get system stats (admin only) */
async function testSystemStats() {
  const result = await serv('system.stats');
  console.log('Pool size:', result.pool_size);
  console.log('Active connections:', result.active_connections);
}

// =============================================================================
// ADMIN USER ENDPOINTS
// =============================================================================

/** List all users (admin only) */
async function testAdminUsersList() {
  const users = await serv('admin.users.list');
  console.log('Users:', users);
}

/** Create a user (admin only) */
async function testAdminUsersCreate() {
  const result = await serv('admin.users.create', {
    login: 'newuser',
    password: 'tempPassword123',
    email: 'newuser@example.com', // optional
    phone: '+1234567890', // optional
    is_admin: false, // optional
  });
  console.log('Created user ID:', result.user_id);
}

/** Get a user (admin only) */
async function testAdminUsersGet() {
  const user = await serv('admin.users.get', {
    user_id: SAMPLE_USER_ID,
  });
  console.log('User:', user);
}

/** Update a user (admin only) */
async function testAdminUsersUpdate() {
  const updated = await serv('admin.users.update', {
    user_id: SAMPLE_USER_ID,
    email: 'updated@example.com',
    is_admin: true,
  });
  console.log('Updated user:', updated);
}

/** Replace a user (admin only) */
async function testAdminUsersReplace() {
  const replaced = await serv('admin.users.replace', {
    user_id: SAMPLE_USER_ID,
    auth: {
      login: 'replaceduser',
      password: 'newPassword123',
      email: 'replaced@example.com',
      isadmin: false,
    },
  });
  console.log('Replaced user:', replaced);
}

/** Delete a user (admin only) */
async function testAdminUsersDelete() {
  await serv('admin.users.delete', {
    user_id: SAMPLE_USER_ID,
  });
  console.log('User deleted');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Check if user is authenticated */
function testIsAuthenticated() {
  const isAuth = isAuthenticated();
  console.log('Is authenticated:', isAuth);
}

/** Clear auth session (logout) */
function testClearAuth() {
  clearAuth();
  console.log('Session cleared');
}

/** Get cached user info (no API call) */
function testGetCurrentUser() {
  const user = getCurrentUser();
  console.log('Cached user:', user);
}

/** Get cached profile (no API call) */
function testGetCachedProfile() {
  const profile = getCachedProfile();
  console.log('Cached profile:', profile);
}

// =============================================================================
// ERROR HANDLING EXAMPLE
// =============================================================================

/** Example of proper error handling */
async function testErrorHandling() {
  try {
    await serv('login', { login: 'wrong', password: 'wrong' });
  } catch (error) {
    if (error instanceof ApiError) {
      console.log('Error message:', error.message);
      console.log('Status code:', error.statusCode);
      console.log('Category:', error.category);
      console.log('User message:', error.getUserMessage());
      
      // Check error type
      if (error.isAuthError()) {
        console.log('Authentication error - redirect to login');
      }
      if (error.isValidationError()) {
        console.log('Validation error - show form errors');
      }
      if (error.isNotFound()) {
        console.log('Not found - show 404 page');
      }
    }
  }
}

// =============================================================================
// EXPORT ALL TEST FUNCTIONS
// =============================================================================

export {
  // Auth
  testRegister,
  testLogin,
  testWhoAmI,
  testMyself,
  
  // Profile
  testProfileGet,
  testProfileUpdate,
  testProfileGetByUsername,
  testProfileUpdateByUsername,
  
  // Avatar
  testAvatarUpload,
  testAvatarGet,
  testAvatarDelete,
  testAvatarGetByUsername,
  
  // Experiences
  testExperiencesList,
  testExperiencesCreate,
  testExperiencesUpdate,
  testExperiencesDelete,
  testExperiencesListByUsername,
  
  // Interests
  testInterestsList,
  testInterestsCreate,
  testInterestsUpdate,
  testInterestsDelete,
  testInterestsListByUsername,
  
  // Categories
  testCategoriesList,
  testCategoriesGet,
  testCategoriesCreate,
  testCategoriesUpdate,
  testCategoriesDelete,
  testCategoriesIconUpload,
  testCategoriesIconGet,
  testCategoriesIconDelete,
  
  // PAPS
  testPapsList,
  testPapsGet,
  testPapsCreate,
  testPapsUpdate,
  testPapsDelete,
  testPapsAddCategory,
  testPapsRemoveCategory,
  
  // PAPS Media
  testPapsMediaList,
  testPapsMediaUpload,
  testPapsMediaGet,
  testPapsMediaDelete,
  
  // Comments
  testCommentsList,
  testCommentsCreate,
  testCommentsGet,
  testCommentsUpdate,
  testCommentsDelete,
  testCommentsReplies,
  testCommentsReply,
  testCommentsThread,
  
  // SPAP
  testSpapListForPaps,
  testSpapMy,
  testSpapApply,
  testSpapGet,
  testSpapWithdraw,
  testSpapUpdateStatus,
  
  // SPAP Media
  testSpapMediaList,
  testSpapMediaUpload,
  testSpapMediaGet,
  testSpapMediaDelete,
  
  // System
  testSystemUptime,
  testSystemInfo,
  testSystemStats,
  
  // Admin Users
  testAdminUsersList,
  testAdminUsersCreate,
  testAdminUsersGet,
  testAdminUsersUpdate,
  testAdminUsersReplace,
  testAdminUsersDelete,
  
  // Helpers
  testIsAuthenticated,
  testClearAuth,
  testGetCurrentUser,
  testGetCachedProfile,
  
  // Error Handling
  testErrorHandling,
};
