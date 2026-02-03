/**
 * serv.test.ts - Comprehensive test file showing ALL serv() usages
 * 
 * This file demonstrates every possible endpoint call with proper typing.
 * Use this as a reference for how to call any API endpoint.
 * 
 * NOTE: This is a reference file, not meant to be run directly.
 * Each function shows how to use a specific endpoint.
 */

import { serv, getMediaUrl } from './index';

// =============================================================================
// SAMPLE DATA
// =============================================================================

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const sampleFile = new Blob(['test'], { type: 'image/png' });
const sampleFiles = [new Blob(['test1'], { type: 'image/png' })];

// =============================================================================
// SYSTEM ENDPOINTS
// =============================================================================

/** GET /uptime (public) */
async function testSystemUptime() {
  const result = await serv('system.uptime');
  console.log('App:', result.app, 'Up:', result.up);
}

/** GET /info (authenticated) */
async function testSystemInfo() {
  const info = await serv('system.info');
  console.log('App:', info.app);
  console.log('Git:', info.git);
}

/** GET /stats (authenticated) */
async function testSystemStats() {
  const stats = await serv('system.stats');
  console.log('Pool stats:', stats.pool_statistics);
}

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
  console.log('User ID:', result.user_id);
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
  console.log('Username:', result.user);
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
  console.log('Avatar:', profile.avatar_url);
}

/** PUT /profile - Full replace */
async function testProfileUpdate() {
  await serv('profile.update', {
    first_name: 'John',
    last_name: 'Doe',
    bio: 'Software developer',
    location_lat: 37.7749,
    location_lng: -122.4194,
  });
  console.log('Profile updated (PUT)');
}

/** PATCH /profile - Partial update */
async function testProfilePatch() {
  await serv('profile.patch', {
    bio: 'Updated bio only',
  });
  console.log('Profile patched');
}

/** GET /user/{username}/profile */
async function testProfileByUsername() {
  const profile = await serv('profile.getByUsername', { username: 'johndoe' });
  console.log('Profile:', profile.display_name);
}

/** PATCH /user/{username}/profile */
async function testProfileUpdateByUsername() {
  await serv('profile.updateByUsername', {
    username: 'johndoe',
    bio: 'Updated via username',
  });
  console.log('Profile updated by username');
}

/** GET /profile/rating */
async function testProfileRating() {
  const rating = await serv('profile.rating');
  console.log('Average:', rating.rating_average);
  console.log('Count:', rating.rating_count);
}

// =============================================================================
// AVATAR ENDPOINTS
// =============================================================================

/** POST /profile/avatar */
async function testAvatarUpload() {
  const result = await serv('avatar.upload', { file: sampleFile });
  console.log('Avatar URL:', result.avatar_url);
}

/**
 * Fetch avatar using media URL
 * Avatar URLs should be accessed via /media/user/profile/{filename}
 * NOT through authenticated endpoints
 */
async function testAvatarFetch() {
  // First get the profile to retrieve avatar_url
  const profile = await serv('profile.get');
  
  if (profile.avatar_url) {
    const avatarUrl = getMediaUrl(profile.avatar_url);
    
    if (avatarUrl) {
      // Fetch using standard fetch API (no auth needed for /media endpoints)
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      console.log('Avatar fetched:', blob.size, 'bytes');
    }
  } else {
    console.log('No avatar set');
  }
}

/**
 * Fetch another user's avatar using media URL
 */
async function testAvatarByUsername() {
  const profile = await serv('profile.getByUsername', { username: 'johndoe' });
  
  if (profile.avatar_url) {
    const avatarUrl = getMediaUrl(profile.avatar_url);
    
    if (avatarUrl) {
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      console.log('User avatar fetched:', blob.size, 'bytes');
    }
  }
}

/** DELETE /profile/avatar */
async function testAvatarDelete() {
  await serv('avatar.delete');
  console.log('Avatar deleted');
}

// =============================================================================
// EXPERIENCES ENDPOINTS
// =============================================================================

/** GET /profile/experiences */
async function testExperiencesList() {
  const experiences = await serv('experiences.list');
  console.log('Experiences:', experiences.length);
}

/** GET /user/{username}/profile/experiences */
async function testExperiencesListByUsername() {
  const experiences = await serv('experiences.listByUsername', { username: 'johndoe' });
  console.log('User experiences:', experiences.length);
}

/** POST /profile/experiences */
async function testExperiencesCreate() {
  const result = await serv('experiences.create', {
    title: 'Senior Developer',
    company_name: 'Tech Corp',
    start_date: '2020-01-15',
    end_date: '2023-06-30',
    description: 'Led development team',
    is_current: false,
  });
  console.log('Created experience:', result.experience_id);
}

/** PATCH /profile/experiences/{experience_id} */
async function testExperiencesUpdate() {
  await serv('experiences.update', {
    experience_id: SAMPLE_UUID,
    title: 'Lead Developer',
    is_current: true,
    end_date: null,
  });
  console.log('Updated');
}

/** DELETE /profile/experiences/{experience_id} */
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

/** GET /user/{username}/profile/interests */
async function testInterestsListByUsername() {
  const interests = await serv('interests.listByUsername', { username: 'johndoe' });
  console.log('User interests:', interests.length);
}

/** POST /profile/interests */
async function testInterestsCreate() {
  const result = await serv('interests.create', {
    category_id: SAMPLE_UUID,
    proficiency_level: 4,
  });
  console.log('Created interest');
}

/** PATCH /profile/interests/{category_id} */
async function testInterestsUpdate() {
  await serv('interests.update', {
    category_id: SAMPLE_UUID,
    proficiency_level: 5,
  });
  console.log('Updated interest');
}

/** DELETE /profile/interests/{category_id} */
async function testInterestsDelete() {
  await serv('interests.delete', { category_id: SAMPLE_UUID });
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

/** GET /categories/{category_id} */
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

/** PUT /categories/{category_id} (Admin) */
async function testCategoriesUpdate() {
  await serv('categories.update', {
    category_id: SAMPLE_UUID,
    name: 'Full Stack Development',
  });
  console.log('Updated');
}

/** DELETE /categories/{category_id} (Admin) */
async function testCategoriesDelete() {
  await serv('categories.delete', { category_id: SAMPLE_UUID });
  console.log('Deleted');
}

/** POST /categories/{category_id}/icon (Admin) */
async function testCategoriesIconUpload() {
  const result = await serv('categories.iconUpload', {
    category_id: SAMPLE_UUID,
    file: sampleFile,
  });
  console.log('Icon uploaded:', result.icon_url);
}

/** GET /categories/{category_id}/icon (Public) */
async function testCategoriesIconGet() {
  const result = await serv('categories.iconGet', { category_id: SAMPLE_UUID });
  console.log('Icon URL:', result);
}

/** DELETE /categories/{category_id}/icon (Admin) */
async function testCategoriesIconDelete() {
  await serv('categories.iconDelete', { category_id: SAMPLE_UUID });
  console.log('Icon deleted');
}

// =============================================================================
// PAPS (JOB POSTINGS) ENDPOINTS
// =============================================================================

/** GET /paps */
async function testPapsList() {
  const result = await serv('paps.list', {
    status: 'published',
    payment_type: 'fixed',
    location_lat: 37.7749,
    location_lng: -122.4194,
    radius_km: 25,
    min_payment: 50,
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 20,
    offset: 0,
  });
  console.log('Found:', result.total, 'jobs');
}

/** GET /paps/{paps_id} */
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
    payment_type: 'fixed',
    payment_amount: 5000,
    payment_currency: 'USD',
    status: 'draft',
    location_address: 'San Francisco, CA',
    location_lat: 37.7749,
    location_lng: -122.4194,
    category_ids: [SAMPLE_UUID],
  });
  console.log('Created PAPS:', result.paps_id);
}

/** PUT /paps/{paps_id} */
async function testPapsUpdate() {
  await serv('paps.update', {
    paps_id: SAMPLE_UUID,
    title: 'Updated Job Title',
    description: 'Updated description with sufficient length for validation.',
    payment_amount: 6000,
  });
  console.log('Updated');
}

/** PUT /paps/{paps_id}/status */
async function testPapsUpdateStatus() {
  await serv('paps.updateStatus', {
    paps_id: SAMPLE_UUID,
    status: 'published',
  });
  console.log('Status updated to published');
}

/** DELETE /paps/{paps_id} */
async function testPapsDelete() {
  await serv('paps.delete', { paps_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// PAPS CATEGORIES ENDPOINTS
// =============================================================================

/** POST /paps/{paps_id}/categories/{category_id} */
async function testPapsCategoriesAdd() {
  await serv('paps.categories.add', {
    paps_id: SAMPLE_UUID,
    category_id: SAMPLE_UUID,
  });
  console.log('Category added to PAPS');
}

/** DELETE /paps/{paps_id}/categories/{category_id} */
async function testPapsCategoriesRemove() {
  await serv('paps.categories.remove', {
    paps_id: SAMPLE_UUID,
    category_id: SAMPLE_UUID,
  });
  console.log('Category removed from PAPS');
}

// =============================================================================
// PAPS MEDIA ENDPOINTS
// =============================================================================

/** GET /paps/{paps_id}/media */
async function testPapsMediaList() {
  const result = await serv('paps.media.list', { paps_id: SAMPLE_UUID });
  console.log('Media count:', result.media?.length || 0);
}

/** POST /paps/{paps_id}/media */
async function testPapsMediaUpload() {
  const result = await serv('paps.media.upload', {
    paps_id: SAMPLE_UUID,
    files: sampleFiles,
  });
  console.log('Uploaded:', result.uploaded?.length || 0, 'files');
}

/** DELETE /paps/media/{media_id} */
async function testPapsMediaDelete() {
  await serv('paps.media.delete', { media_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// PAPS SCHEDULE ENDPOINTS
// =============================================================================

/** GET /paps/{paps_id}/schedules */
async function testPapsScheduleList() {
  const schedules = await serv('paps.schedule.list', { paps_id: SAMPLE_UUID });
  console.log('Schedule entries:', schedules.length);
}

/** GET /paps/{paps_id}/schedules/{schedule_id} */
async function testPapsScheduleGet() {
  const schedule = await serv('paps.schedule.get', {
    paps_id: SAMPLE_UUID,
    schedule_id: SAMPLE_UUID,
  });
  console.log('Schedule:', schedule.start_datetime);
}

/** POST /paps/{paps_id}/schedules */
async function testPapsScheduleCreate() {
  const result = await serv('paps.schedule.create', {
    paps_id: SAMPLE_UUID,
    start_datetime: '2024-03-01T09:00:00Z',
    end_datetime: '2024-03-01T17:00:00Z',
    recurrence_rule: 'WEEKLY',
    recurrence_end_date: '2024-06-01',
  });
  console.log('Created schedule:', result.schedule_id);
}

/** PUT /paps/{paps_id}/schedules/{schedule_id} */
async function testPapsScheduleUpdate() {
  await serv('paps.schedule.update', {
    paps_id: SAMPLE_UUID,
    schedule_id: SAMPLE_UUID,
    start_datetime: '2024-03-01T10:00:00Z',
    end_datetime: '2024-03-01T18:00:00Z',
  });
  console.log('Schedule updated');
}

/** DELETE /paps/{paps_id}/schedules/{schedule_id} */
async function testPapsScheduleDelete() {
  await serv('paps.schedule.delete', {
    paps_id: SAMPLE_UUID,
    schedule_id: SAMPLE_UUID,
  });
  console.log('Schedule deleted');
}

// =============================================================================
// SPAP (APPLICATIONS) ENDPOINTS
// =============================================================================

/** GET /spap/my - Get current user's applications */
async function testSpapMy() {
  const result = await serv('spap.my');
  console.log('My applications:', result.applications?.length || 0);
}

/** GET /paps/{paps_id}/applications - Get applications for a PAPS (owner only) */
async function testSpapListByPaps() {
  const result = await serv('spap.listByPaps', { paps_id: SAMPLE_UUID });
  console.log('Applications:', result.applications?.length || 0);
}

/** GET /spap/{spap_id} - Get specific application */
async function testSpapGet() {
  const spap = await serv('spap.get', { spap_id: SAMPLE_UUID });
  console.log('Application status:', spap.status);
}

/** POST /paps/{paps_id}/apply - Apply to a job posting */
async function testSpapApply() {
  const result = await serv('spap.apply', {
    paps_id: SAMPLE_UUID,
    message: 'I would love to work on this project!',
  });
  console.log('Applied:', result.spap_id);
  console.log('Chat thread:', result.chat_thread_id);
}

/** PUT /spap/{spap_id}/accept - Accept application (owner only) */
async function testSpapAccept() {
  const result = await serv('spap.accept', { spap_id: SAMPLE_UUID });
  console.log('Accepted, created ASAP:', result.asap_id);
}

/** PUT /spap/{spap_id}/reject - Reject application (owner only) */
async function testSpapReject() {
  await serv('spap.reject', { spap_id: SAMPLE_UUID, reason: 'Position filled' });
  console.log('Application rejected');
}

/** DELETE /spap/{spap_id} - Withdraw application */
async function testSpapWithdraw() {
  await serv('spap.withdraw', { spap_id: SAMPLE_UUID });
  console.log('Application withdrawn');
}

/** GET /spap/{spap_id}/media */
async function testSpapMediaList() {
  const result = await serv('spap.media.list', { spap_id: SAMPLE_UUID });
  console.log('SPAP media:', result.media?.length || 0);
}

/** POST /spap/{spap_id}/media */
async function testSpapMediaUpload() {
  const result = await serv('spap.media.upload', {
    spap_id: SAMPLE_UUID,
    files: sampleFiles,
  });
  console.log('Uploaded SPAP media');
}

/** DELETE /spap/media/{media_id} */
async function testSpapMediaDelete() {
  await serv('spap.media.delete', { media_id: SAMPLE_UUID });
  console.log('SPAP media deleted');
}

/** GET /spap/{spap_id}/chat */
async function testSpapChat() {
  const thread = await serv('spap.chat', { spap_id: SAMPLE_UUID });
  console.log('SPAP chat thread:', thread.thread_id);
}

// =============================================================================
// ASAP (ASSIGNMENTS) ENDPOINTS
// =============================================================================

/** GET /asap - Get current user's assignments */
async function testAsapMy() {
  const result = await serv('asap.my');
  console.log('As worker:', result.as_worker?.length || 0);
  console.log('As owner:', result.as_owner?.length || 0);
}

/** GET /paps/{paps_id}/assignments - Get assignments for a PAPS (owner only) */
async function testAsapListByPaps() {
  const result = await serv('asap.listByPaps', { paps_id: SAMPLE_UUID });
  console.log('Assignments:', result.assignments?.length || 0);
}

/** GET /asap/{asap_id} - Get specific assignment */
async function testAsapGet() {
  const asap = await serv('asap.get', { asap_id: SAMPLE_UUID });
  console.log('Assignment status:', asap.status);
}

/** PUT /asap/{asap_id}/status - Update assignment status */
async function testAsapUpdateStatus() {
  await serv('asap.updateStatus', {
    asap_id: SAMPLE_UUID,
    status: 'completed',
  });
  console.log('Marked complete');
}

/** DELETE /asap/{asap_id} - Delete assignment */
async function testAsapDelete() {
  await serv('asap.delete', { asap_id: SAMPLE_UUID });
  console.log('Assignment deleted');
}

/** GET /asap/{asap_id}/media */
async function testAsapMediaList() {
  const result = await serv('asap.media.list', { asap_id: SAMPLE_UUID });
  console.log('ASAP media:', result.media?.length || 0);
}

/** POST /asap/{asap_id}/media */
async function testAsapMediaUpload() {
  const result = await serv('asap.media.upload', {
    asap_id: SAMPLE_UUID,
    files: sampleFiles,
  });
  console.log('Uploaded ASAP media');
}

/** DELETE /asap/media/{media_id} */
async function testAsapMediaDelete() {
  await serv('asap.media.delete', { media_id: SAMPLE_UUID });
  console.log('ASAP media deleted');
}

/** POST /asap/{asap_id}/rate - Rate user for completed assignment */
async function testAsapRate() {
  const result = await serv('asap.rate', {
    asap_id: SAMPLE_UUID,
    score: 5,
  });
  console.log('Rated user:', result.rated_user_id);
}

/** GET /asap/{asap_id}/can-rate - Check if can rate */
async function testAsapCanRate() {
  const result = await serv('asap.canRate', { asap_id: SAMPLE_UUID });
  console.log('Can rate:', result.can_rate);
  if (result.can_rate) {
    console.log('User to rate:', result.user_to_rate_id);
  }
}

/** GET /asap/{asap_id}/chat */
async function testAsapChat() {
  const thread = await serv('asap.chat', { asap_id: SAMPLE_UUID });
  console.log('ASAP chat thread:', thread.thread_id);
}

// =============================================================================
// PAYMENTS ENDPOINTS
// =============================================================================

/** GET /payments - Get current user's payments */
async function testPaymentsMy() {
  const result = await serv('payments.my');
  console.log('Sent payments:', result.sent?.length || 0);
  console.log('Received payments:', result.received?.length || 0);
}

/** GET /paps/{paps_id}/payments */
async function testPaymentsListForPaps() {
  const result = await serv('payments.listForPaps', { paps_id: SAMPLE_UUID });
  console.log('Payments for PAPS:', result.payments?.length || 0);
}

/** POST /paps/{paps_id}/payments */
async function testPaymentsCreate() {
  const result = await serv('payments.create', {
    paps_id: SAMPLE_UUID,
    payee_id: SAMPLE_UUID,
    amount: 500,
    currency: 'USD',
    payment_method: 'transfer',
  });
  console.log('Created payment:', result.payment_id);
}

/** GET /payments/{payment_id} */
async function testPaymentsGet() {
  const payment = await serv('payments.get', { payment_id: SAMPLE_UUID });
  console.log('Payment:', payment.amount, payment.currency);
  console.log('Status:', payment.status);
}

/** PUT /payments/{payment_id}/status */
async function testPaymentsUpdateStatus() {
  await serv('payments.updateStatus', {
    payment_id: SAMPLE_UUID,
    status: 'completed',
    transaction_id: 'txn_12345',
  });
  console.log('Payment completed');
}

/** DELETE /payments/{payment_id} */
async function testPaymentsDelete() {
  await serv('payments.delete', { payment_id: SAMPLE_UUID });
  console.log('Payment deleted');
}

// =============================================================================
// RATINGS ENDPOINTS
// =============================================================================

/** GET /users/{user_id}/rating */
async function testRatingsForUser() {
  const result = await serv('ratings.forUser', { user_id: SAMPLE_UUID });
  console.log('Average rating:', result.rating_average);
  console.log('Rating count:', result.rating_count);
}

/** GET /profile/rating - Same as profile.rating */
async function testRatingsMy() {
  const result = await serv('ratings.my');
  console.log('My average:', result.rating_average);
  console.log('My count:', result.rating_count);
}

// Note: To submit a rating, use asap.rate endpoint (see ASAP section)

// =============================================================================
// COMMENTS ENDPOINTS
// =============================================================================

/** GET /paps/{paps_id}/comments */
async function testCommentsList() {
  const result = await serv('comments.list', { 
    paps_id: SAMPLE_UUID,
  });
  console.log('Comments:', result.count);
  console.log('Total with replies:', result.total_count);
}

/** POST /paps/{paps_id}/comments */
async function testCommentsCreate() {
  const result = await serv('comments.create', {
    paps_id: SAMPLE_UUID,
    content: 'Great opportunity!',
  });
  console.log('Created comment:', result.comment_id);
}

/** GET /comments/{comment_id} */
async function testCommentsGet() {
  const comment = await serv('comments.get', { comment_id: SAMPLE_UUID });
  console.log('Comment:', comment.content);
  console.log('By:', comment.username);
}

/** PUT /comments/{comment_id} */
async function testCommentsUpdate() {
  await serv('comments.update', {
    comment_id: SAMPLE_UUID,
    content: 'Updated comment content',
  });
  console.log('Updated');
}

/** DELETE /comments/{comment_id} */
async function testCommentsDelete() {
  await serv('comments.delete', { comment_id: SAMPLE_UUID });
  console.log('Deleted');
}

/** GET /comments/{comment_id}/replies */
async function testCommentsRepliesList() {
  const result = await serv('comments.replies.list', { comment_id: SAMPLE_UUID });
  console.log('Replies:', result.count);
}

/** POST /comments/{comment_id}/replies */
async function testCommentsRepliesCreate() {
  const result = await serv('comments.replies.create', {
    comment_id: SAMPLE_UUID,
    content: 'Thanks for your interest!',
  });
  console.log('Created reply:', result.comment_id);
}

/** GET /comments/{comment_id}/thread */
async function testCommentsThread() {
  const result = await serv('comments.thread', { comment_id: SAMPLE_UUID });
  console.log('Comment:', result.comment.content);
  console.log('Replies:', result.replies.length);
}

// =============================================================================
// CHAT ENDPOINTS
// =============================================================================

/** GET /chat */
async function testChatList() {
  const result = await serv('chat.list');
  console.log('Threads:', result.threads?.length || 0);
}

/** POST /chat */
async function testChatCreate() {
  const result = await serv('chat.create', {
    participant_ids: [SAMPLE_UUID],
    paps_id: SAMPLE_UUID,
    initial_message: 'Hi! I am interested in your job posting.',
  });
  console.log('Created thread:', result.thread_id);
}

/** GET /chat/{thread_id} */
async function testChatGet() {
  const thread = await serv('chat.get', { thread_id: SAMPLE_UUID });
  console.log('Participants:', thread.participants?.length || 0);
}

/** DELETE /chat/{thread_id}/leave */
async function testChatLeave() {
  await serv('chat.leave', { thread_id: SAMPLE_UUID });
  console.log('Left thread');
}

/** GET /chat/{thread_id}/messages */
async function testChatMessagesList() {
  const result = await serv('chat.messages.list', {
    thread_id: SAMPLE_UUID,
    limit: 50,
  });
  console.log('Messages:', result.messages?.length || 0);
}

/** POST /chat/{thread_id}/messages */
async function testChatMessagesSend() {
  const result = await serv('chat.messages.send', {
    thread_id: SAMPLE_UUID,
    content: 'Hello!',
  });
  console.log('Sent message:', result.message_id);
}

/** PUT /chat/{thread_id}/messages/{message_id} */
async function testChatMessagesUpdate() {
  await serv('chat.messages.update', {
    thread_id: SAMPLE_UUID,
    message_id: SAMPLE_UUID,
    content: 'Edited message',
  });
  console.log('Message updated');
}

/** PUT /chat/{thread_id}/messages/{message_id}/read */
async function testChatMessagesMarkRead() {
  await serv('chat.messages.markRead', {
    thread_id: SAMPLE_UUID,
    message_id: SAMPLE_UUID,
  });
  console.log('Message marked as read');
}

/** PUT /chat/{thread_id}/read */
async function testChatMarkAllRead() {
  await serv('chat.markAllRead', { thread_id: SAMPLE_UUID });
  console.log('All messages marked as read');
}

/** GET /chat/{thread_id}/unread */
async function testChatUnreadCount() {
  const result = await serv('chat.unreadCount', { thread_id: SAMPLE_UUID });
  console.log('Unread count:', result.unread_count);
}

// =============================================================================
// ADMIN USER ENDPOINTS
// =============================================================================

/** GET /users (admin) */
async function testAdminUsersList() {
  const result = await serv('admin.users.list');
  console.log('Users:', result.users?.length || 0);
  console.log('Total:', result.total);
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

/** GET /users/{user_id} (admin) */
async function testAdminUsersGet() {
  const result = await serv('admin.users.get', { user_id: SAMPLE_UUID });
  console.log('User:', result.user.login);
}

/** PATCH /users/{user_id} (admin) */
async function testAdminUsersUpdate() {
  await serv('admin.users.update', {
    user_id: SAMPLE_UUID,
    is_admin: true,
  });
  console.log('Updated');
}

/** PUT /users/{user_id} (admin) */
async function testAdminUsersReplace() {
  await serv('admin.users.replace', {
    user_id: SAMPLE_UUID,
    auth: {
      login: 'updateduser',
      password: 'NewPassword123!',
      email: 'updated@example.com',
      isadmin: false,
    },
  });
  console.log('Replaced');
}

/** DELETE /users/{user_id} (admin) */
async function testAdminUsersDelete() {
  await serv('admin.users.delete', { user_id: SAMPLE_UUID });
  console.log('Deleted');
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // System
  testSystemUptime,
  testSystemInfo,
  testSystemStats,
  
  // Auth
  testRegister,
  testLogin,
  testWhoAmI,
  testMyself,
  
  // Profile
  testProfileGet,
  testProfileUpdate,
  testProfilePatch,
  testProfileByUsername,
  testProfileUpdateByUsername,
  testProfileRating,
  
  // Avatar
  testAvatarUpload,
  testAvatarFetch,
  testAvatarByUsername,
  testAvatarDelete,
  
  // Experiences
  testExperiencesList,
  testExperiencesListByUsername,
  testExperiencesCreate,
  testExperiencesUpdate,
  testExperiencesDelete,
  
  // Interests
  testInterestsList,
  testInterestsListByUsername,
  testInterestsCreate,
  testInterestsUpdate,
  testInterestsDelete,
  
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
  testPapsUpdateStatus,
  testPapsDelete,
  testPapsCategoriesAdd,
  testPapsCategoriesRemove,
  testPapsMediaList,
  testPapsMediaUpload,
  testPapsMediaDelete,
  testPapsScheduleList,
  testPapsScheduleGet,
  testPapsScheduleCreate,
  testPapsScheduleUpdate,
  testPapsScheduleDelete,
  
  // SPAP
  testSpapMy,
  testSpapListByPaps,
  testSpapGet,
  testSpapApply,
  testSpapAccept,
  testSpapReject,
  testSpapWithdraw,
  testSpapMediaList,
  testSpapMediaUpload,
  testSpapMediaDelete,
  testSpapChat,
  
  // ASAP
  testAsapMy,
  testAsapListByPaps,
  testAsapGet,
  testAsapUpdateStatus,
  testAsapDelete,
  testAsapMediaList,
  testAsapMediaUpload,
  testAsapMediaDelete,
  testAsapRate,
  testAsapCanRate,
  testAsapChat,
  
  // Payments
  testPaymentsMy,
  testPaymentsListForPaps,
  testPaymentsCreate,
  testPaymentsGet,
  testPaymentsUpdateStatus,
  testPaymentsDelete,
  
  // Ratings
  testRatingsForUser,
  testRatingsMy,
  
  // Comments
  testCommentsList,
  testCommentsCreate,
  testCommentsGet,
  testCommentsUpdate,
  testCommentsDelete,
  testCommentsRepliesList,
  testCommentsRepliesCreate,
  testCommentsThread,
  
  // Chat
  testChatList,
  testChatCreate,
  testChatGet,
  testChatLeave,
  testChatMessagesList,
  testChatMessagesSend,
  testChatMessagesUpdate,
  testChatMessagesMarkRead,
  testChatMarkAllRead,
  testChatUnreadCount,
  
  // Admin
  testAdminUsersList,
  testAdminUsersCreate,
  testAdminUsersGet,
  testAdminUsersUpdate,
  testAdminUsersReplace,
  testAdminUsersDelete,
};
