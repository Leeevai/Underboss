/**
 * serv.test.ts - Comprehensive test file showing ALL serv() usages
 * 
 * This file demonstrates every possible endpoint call with proper typing.
 * Use this as a reference for how to call any API endpoint.
 * 
 * NOTE: This is a reference file, not meant to be run directly.
 * Each function shows how to use a specific endpoint.
 */

import { serv } from './index.new';

// =============================================================================
// SAMPLE DATA
// =============================================================================

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const sampleFile = new Blob(['test'], { type: 'image/png' });
const sampleFiles = [new Blob(['test1'], { type: 'image/png' })];

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

/** POST /register */
async function testRegister() {
  const result = await serv('register', {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    phone: '+1234567890', // optional
  });
  console.log('User ID:', result.userId);
}

/** POST /login - Auto-saves token, returns UserInfo */
async function testLogin() {
  const user = await serv('login', {
    login: 'john@example.com', // username, email, or phone
    password: 'SecurePass123!',
  });
  console.log('Welcome', user.username);
  console.log('Is Admin:', user.isAdmin);
}

/** GET /who-am-i */
async function testWhoAmI() {
  const result = await serv('whoami');
  console.log('Username:', result.username);
}

/** GET /myself - Returns clean UserInfo */
async function testMyself() {
  const user = await serv('myself');
  console.log('User ID:', user.userId);
  console.log('Email:', user.email);
}

// =============================================================================
// PROFILE ENDPOINTS
// =============================================================================

/** GET /profile */
async function testProfileGet() {
  const profile = await serv('profile.get');
  console.log('Name:', profile.first_name, profile.last_name);
}

/** PUT /profile */
async function testProfileUpdate() {
  const profile = await serv('profile.update', {
    first_name: 'John',
    last_name: 'Doe',
    bio: 'Software developer',
    location_lat: 37.7749,
    location_lng: -122.4194,
  });
  console.log('Updated:', profile.first_name);
}

/** GET /user/{username}/profile */
async function testProfileByUsername() {
  const profile = await serv('profile.getByUsername', { username: 'johndoe' });
  console.log('Profile:', profile.display_name);
}

// =============================================================================
// AVATAR ENDPOINTS
// =============================================================================

/** POST /profile/avatar */
async function testAvatarUpload() {
  const result = await serv('avatar.upload', { file: sampleFile });
  console.log('Avatar URL:', result.avatar_url);
}

/** GET /profile/avatar - Returns Blob */
async function testAvatarGet() {
  const blob = await serv('avatar.get');
  console.log('Avatar size:', blob.size);
}

/** DELETE /profile/avatar */
async function testAvatarDelete() {
  await serv('avatar.delete');
  console.log('Avatar deleted');
}

/** GET /user/{username}/profile/avatar */
async function testAvatarByUsername() {
  const blob = await serv('avatar.getByUsername', { username: 'johndoe' });
  console.log('Avatar size:', blob.size);
}

// =============================================================================
// EXPERIENCES ENDPOINTS
// =============================================================================

/** GET /profile/experiences */
async function testExperiencesList() {
  const experiences = await serv('experiences.list');
  console.log('Experiences:', experiences.length);
}

/** POST /profile/experiences */
async function testExperiencesCreate() {
  const result = await serv('experiences.create', {
    job_title: 'Senior Developer',
    company_name: 'Tech Corp',
    start_date: '2020-01-15',
    end_date: '2023-06-30',
    description: 'Led development team',
  });
  console.log('Created experience:', result.experience_id);
}

/** PUT /profile/experiences/{id} */
async function testExperiencesUpdate() {
  await serv('experiences.update', {
    experience_id: SAMPLE_UUID,
    job_title: 'Lead Developer',
  });
  console.log('Updated');
}

/** DELETE /profile/experiences/{id} */
async function testExperiencesDelete() {
  await serv('experiences.delete', { experience_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// INTERESTS ENDPOINTS
// =============================================================================

/** GET /profile/interests */
async function testInterestsList() {
  const interests = await serv('interests.list');
  console.log('Interests:', interests.length);
}

/** POST /profile/interests */
async function testInterestsCreate() {
  const result = await serv('interests.create', {
    category_id: SAMPLE_UUID,
    proficiency_level: 4,
  });
  console.log('Created interest:', result.interest_id);
}

/** DELETE /profile/interests/{id} */
async function testInterestsDelete() {
  await serv('interests.delete', { interest_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// CATEGORIES ENDPOINTS
// =============================================================================

/** GET /categories */
async function testCategoriesList() {
  const categories = await serv('categories.list');
  console.log('Categories:', categories.length);
}

/** GET /categories/{id} */
async function testCategoriesGet() {
  const category = await serv('categories.get', { category_id: SAMPLE_UUID });
  console.log('Category:', category.name);
}

/** POST /categories (Admin) */
async function testCategoriesCreate() {
  const result = await serv('categories.create', {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Web development services',
  });
  console.log('Created:', result.category_id);
}

/** PUT /categories/{id} (Admin) */
async function testCategoriesUpdate() {
  await serv('categories.update', {
    category_id: SAMPLE_UUID,
    name: 'Full Stack Development',
  });
  console.log('Updated');
}

/** DELETE /categories/{id} (Admin) */
async function testCategoriesDelete() {
  await serv('categories.delete', { category_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// PAPS (JOB POSTINGS) ENDPOINTS
// =============================================================================

/** GET /paps */
async function testPapsList() {
  const result = await serv('paps.list', {
    status: 'published',
    location_lat: 37.7749,
    location_lng: -122.4194,
    radius_km: 25,
    min_payment: 50,
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 20,
  });
  console.log('Found:', result.total, 'jobs');
}

/** GET /paps/{id} */
async function testPapsGet() {
  const paps = await serv('paps.get', { paps_id: SAMPLE_UUID });
  console.log('Job:', paps.title);
  console.log('Applications:', paps.application_count);
}

/** POST /paps */
async function testPapsCreate() {
  const result = await serv('paps.create', {
    title: 'Need React Developer',
    description: 'Looking for an experienced React developer for a 3-month project.',
    payment_amount: 5000,
    payment_currency: 'USD',
    status: 'published',
    location_address: 'San Francisco, CA',
    location_lat: 37.7749,
    location_lng: -122.4194,
    category_ids: [SAMPLE_UUID],
  });
  console.log('Created PAPS:', result.paps_id);
}

/** PUT /paps/{id} */
async function testPapsUpdate() {
  await serv('paps.update', {
    paps_id: SAMPLE_UUID,
    title: 'Updated Job Title',
    payment_amount: 6000,
  });
  console.log('Updated');
}

/** DELETE /paps/{id} */
async function testPapsDelete() {
  await serv('paps.delete', { paps_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// PAPS MEDIA ENDPOINTS
// =============================================================================

/** GET /paps/{id}/media */
async function testPapsMediaList() {
  const result = await serv('paps.media.list', { paps_id: SAMPLE_UUID });
  console.log('Media count:', result.media_count);
}

/** POST /paps/{id}/media */
async function testPapsMediaUpload() {
  const result = await serv('paps.media.upload', {
    paps_id: SAMPLE_UUID,
    files: sampleFiles,
  });
  console.log('Uploaded:', result.count, 'files');
}

/** DELETE /paps/{id}/media/{media_id} */
async function testPapsMediaDelete() {
  await serv('paps.media.delete', { 
    paps_id: SAMPLE_UUID, 
    media_id: SAMPLE_UUID 
  });
  console.log('Deleted');
}

// =============================================================================
// PAPS SCHEDULE ENDPOINTS
// =============================================================================

/** GET /paps/{id}/schedule */
async function testPapsScheduleList() {
  const schedule = await serv('paps.schedule.list', { paps_id: SAMPLE_UUID });
  console.log('Schedule entries:', schedule.length);
}

/** POST /paps/{id}/schedule */
async function testPapsScheduleCreate() {
  const result = await serv('paps.schedule.create', {
    paps_id: SAMPLE_UUID,
    start_time: '2024-03-01T09:00:00Z',
    end_time: '2024-03-01T17:00:00Z',
    is_recurring: true,
    recurrence_pattern: 'weekly',
  });
  console.log('Created schedule:', result.schedule_id);
}

// =============================================================================
// SPAP (APPLICATIONS) ENDPOINTS
// =============================================================================

/** GET /spaps */
async function testSpapList() {
  const result = await serv('spap.list', { status: 'pending' });
  console.log('Applications:', result.spaps.length);
}

/** GET /spaps/{id} */
async function testSpapGet() {
  const spap = await serv('spap.get', { spap_id: SAMPLE_UUID });
  console.log('Application status:', spap.status);
}

/** POST /spaps */
async function testSpapCreate() {
  const result = await serv('spap.create', {
    paps_id: SAMPLE_UUID,
    message: 'I would love to work on this project!',
  });
  console.log('Applied:', result.spap_id);
}

/** PATCH /spaps/{id} */
async function testSpapUpdate() {
  await serv('spap.update', {
    spap_id: SAMPLE_UUID,
    status: 'accepted',
  });
  console.log('Updated');
}

/** DELETE /spaps/{id} */
async function testSpapDelete() {
  await serv('spap.delete', { spap_id: SAMPLE_UUID });
  console.log('Withdrawn');
}

// =============================================================================
// ASAP (ASSIGNMENTS) ENDPOINTS
// =============================================================================

/** GET /asaps */
async function testAsapList() {
  const result = await serv('asap.list', { status: 'in_progress' });
  console.log('Assignments:', result.asaps.length);
}

/** GET /asaps/{id} */
async function testAsapGet() {
  const asap = await serv('asap.get', { asap_id: SAMPLE_UUID });
  console.log('Assignment status:', asap.status);
}

/** POST /asaps */
async function testAsapCreate() {
  const result = await serv('asap.create', {
    paps_id: SAMPLE_UUID,
    accepted_user_id: SAMPLE_UUID,
  });
  console.log('Created assignment:', result.asap_id);
}

/** PATCH /asaps/{id} */
async function testAsapUpdate() {
  await serv('asap.update', {
    asap_id: SAMPLE_UUID,
    status: 'completed',
  });
  console.log('Marked complete');
}

// =============================================================================
// PAYMENTS ENDPOINTS
// =============================================================================

/** GET /paps/{id}/payments */
async function testPaymentsForPaps() {
  const result = await serv('payments.listForPaps', { paps_id: SAMPLE_UUID });
  console.log('Payments:', result.payments.length);
}

/** POST /paps/{id}/payments */
async function testPaymentsCreate() {
  const result = await serv('payments.create', {
    paps_id: SAMPLE_UUID,
    payee_id: SAMPLE_UUID,
    amount: 500,
    currency: 'USD',
    payment_method: 'card',
  });
  console.log('Created payment:', result.payment_id);
}

/** GET /payments/{id} */
async function testPaymentsGet() {
  const payment = await serv('payments.get', { payment_id: SAMPLE_UUID });
  console.log('Payment:', payment.amount, payment.currency);
}

/** PATCH /payments/{id} */
async function testPaymentsUpdate() {
  await serv('payments.update', {
    payment_id: SAMPLE_UUID,
    status: 'completed',
  });
  console.log('Payment completed');
}

/** GET /user/payments */
async function testPaymentsMy() {
  const result = await serv('payments.my', { role: 'payee' });
  console.log('My payments:', result.payments.length);
}

// =============================================================================
// RATINGS ENDPOINTS
// =============================================================================

/** GET /ratings/{user_id} */
async function testRatingsForUser() {
  const result = await serv('ratings.forUser', { user_id: SAMPLE_UUID });
  console.log('Average rating:', result.average_rating);
}

/** POST /ratings */
async function testRatingsCreate() {
  const result = await serv('ratings.create', {
    paps_id: SAMPLE_UUID,
    rated_user_id: SAMPLE_UUID,
    rating: 5,
    review: 'Excellent work!',
  });
  console.log('Created rating:', result.rating_id);
}

/** PATCH /ratings/{id} */
async function testRatingsUpdate() {
  await serv('ratings.update', {
    rating_id: SAMPLE_UUID,
    rating: 4,
    review: 'Good work',
  });
  console.log('Updated');
}

/** DELETE /ratings/{id} */
async function testRatingsDelete() {
  await serv('ratings.delete', { rating_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// COMMENTS ENDPOINTS
// =============================================================================

/** GET /paps/{id}/comments */
async function testCommentsList() {
  const result = await serv('comments.list', { 
    paps_id: SAMPLE_UUID,
    limit: 20,
  });
  console.log('Comments:', result.total);
}

/** POST /paps/{id}/comments */
async function testCommentsCreate() {
  const result = await serv('comments.create', {
    paps_id: SAMPLE_UUID,
    content: 'Great opportunity!',
  });
  console.log('Created comment:', result.comment_id);
}

/** POST /paps/{id}/comments (reply) */
async function testCommentsReply() {
  const result = await serv('comments.create', {
    paps_id: SAMPLE_UUID,
    content: 'Thanks for your interest!',
    parent_id: SAMPLE_UUID,
  });
  console.log('Created reply:', result.comment_id);
}

/** GET /comments/{id} */
async function testCommentsGet() {
  const comment = await serv('comments.get', { comment_id: SAMPLE_UUID });
  console.log('Comment:', comment.content);
}

/** PATCH /comments/{id} */
async function testCommentsUpdate() {
  await serv('comments.update', {
    comment_id: SAMPLE_UUID,
    content: 'Updated comment content',
  });
  console.log('Updated');
}

/** DELETE /comments/{id} */
async function testCommentsDelete() {
  await serv('comments.delete', { comment_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// CHAT ENDPOINTS
// =============================================================================

/** GET /chats */
async function testChatList() {
  const result = await serv('chat.list', { unread_only: true });
  console.log('Threads:', result.threads.length);
}

/** POST /chats */
async function testChatCreate() {
  const result = await serv('chat.create', {
    participant_ids: [SAMPLE_UUID],
    paps_id: SAMPLE_UUID,
    initial_message: 'Hi! I am interested in your job posting.',
  });
  console.log('Created thread:', result.thread_id);
}

/** GET /chats/{id} */
async function testChatGet() {
  const thread = await serv('chat.get', { thread_id: SAMPLE_UUID });
  console.log('Participants:', thread.participants.length);
}

/** GET /chats/{id}/messages */
async function testChatMessages() {
  const result = await serv('chat.messages.list', {
    thread_id: SAMPLE_UUID,
    limit: 50,
  });
  console.log('Messages:', result.total);
}

/** POST /chats/{id}/messages */
async function testChatSend() {
  const result = await serv('chat.messages.send', {
    thread_id: SAMPLE_UUID,
    content: 'Hello!',
  });
  console.log('Sent message:', result.message_id);
}

/** POST /chats/{id}/read */
async function testChatMarkRead() {
  await serv('chat.messages.read', { thread_id: SAMPLE_UUID });
  console.log('Marked as read');
}

/** DELETE /chats/{id} */
async function testChatDelete() {
  await serv('chat.delete', { thread_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// SYSTEM ENDPOINTS
// =============================================================================

/** GET /uptime (no auth) */
async function testSystemUptime() {
  const result = await serv('system.uptime');
  console.log('App:', result.app, 'Up:', result.up);
}

/** GET /info (admin) */
async function testSystemInfo() {
  const info = await serv('system.info');
  console.log('Version:', info.version);
}

/** GET /stats (admin) */
async function testSystemStats() {
  const stats = await serv('system.stats');
  console.log('Stats:', stats.pool_statistics);
}

// =============================================================================
// ADMIN USER ENDPOINTS
// =============================================================================

/** GET /users (admin) */
async function testAdminUsersList() {
  const users = await serv('admin.users.list');
  console.log('Users:', users.length);
}

/** POST /users (admin) */
async function testAdminUsersCreate() {
  const result = await serv('admin.users.create', {
    login: 'newuser',
    password: 'Password123!',
    email: 'new@example.com',
    is_admin: false,
  });
  console.log('Created user:', result.user_id);
}

/** GET /users/{id} (admin) */
async function testAdminUsersGet() {
  const user = await serv('admin.users.get', { user_id: SAMPLE_UUID });
  console.log('User:', user.login);
}

/** PATCH /users/{id} (admin) */
async function testAdminUsersUpdate() {
  await serv('admin.users.update', {
    user_id: SAMPLE_UUID,
    is_admin: true,
  });
  console.log('Updated');
}

/** DELETE /users/{id} (admin) */
async function testAdminUsersDelete() {
  await serv('admin.users.delete', { user_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// EXPORTS
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
  testProfileByUsername,
  // Avatar
  testAvatarUpload,
  testAvatarGet,
  testAvatarDelete,
  testAvatarByUsername,
  // Experiences
  testExperiencesList,
  testExperiencesCreate,
  testExperiencesUpdate,
  testExperiencesDelete,
  // Interests
  testInterestsList,
  testInterestsCreate,
  testInterestsDelete,
  // Categories
  testCategoriesList,
  testCategoriesGet,
  testCategoriesCreate,
  testCategoriesUpdate,
  testCategoriesDelete,
  // PAPS
  testPapsList,
  testPapsGet,
  testPapsCreate,
  testPapsUpdate,
  testPapsDelete,
  testPapsMediaList,
  testPapsMediaUpload,
  testPapsMediaDelete,
  testPapsScheduleList,
  testPapsScheduleCreate,
  // SPAP
  testSpapList,
  testSpapGet,
  testSpapCreate,
  testSpapUpdate,
  testSpapDelete,
  // ASAP
  testAsapList,
  testAsapGet,
  testAsapCreate,
  testAsapUpdate,
  // Payments
  testPaymentsForPaps,
  testPaymentsCreate,
  testPaymentsGet,
  testPaymentsUpdate,
  testPaymentsMy,
  // Ratings
  testRatingsForUser,
  testRatingsCreate,
  testRatingsUpdate,
  testRatingsDelete,
  // Comments
  testCommentsList,
  testCommentsCreate,
  testCommentsReply,
  testCommentsGet,
  testCommentsUpdate,
  testCommentsDelete,
  // Chat
  testChatList,
  testChatCreate,
  testChatGet,
  testChatMessages,
  testChatSend,
  testChatMarkRead,
  testChatDelete,
  // System
  testSystemUptime,
  testSystemInfo,
  testSystemStats,
  // Admin
  testAdminUsersList,
  testAdminUsersCreate,
  testAdminUsersGet,
  testAdminUsersUpdate,
  testAdminUsersDelete,
};
