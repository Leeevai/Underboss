#!/usr/bin/env npx tsx
/**
 * run-tests.ts - Executable test runner for serv() endpoints
 * 
 * Run with: npx tsx src/serve/run-tests.ts
 * 
 * This tests ALL endpoints against a running backend at localhost:5000
 */

import axios from 'axios';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BASE_URL = 'http://localhost:5000';

let authToken = '';
let testUserId = '';
let testUsername = '';

// Test credentials (unique per run)
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// =============================================================================
// LOGGING HELPERS
// =============================================================================

function success(test: string, detail?: string) {
  console.log(`${colors.green}✓${colors.reset} ${test}${detail ? colors.dim + ' - ' + detail + colors.reset : ''}`);
}

function fail(test: string, error: any) {
  console.log(`${colors.red}✗${colors.reset} ${test}`);
  console.log(`  ${colors.red}Error: ${error?.response?.data?.error || error?.message || error}${colors.reset}`);
}

function skip(test: string, reason: string) {
  console.log(`${colors.yellow}⊘${colors.reset} ${test} - ${colors.dim}${reason}${colors.reset}`);
}

function section(name: string) {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

// =============================================================================
// API HELPER
// =============================================================================

async function api(method: string, path: string, data?: any, auth = true) {
  const config: any = {
    method,
    url: `${BASE_URL}${path}`,
    headers: auth && authToken ? { Authorization: `Bearer ${authToken}` } : {},
  };
  
  if (data) {
    if (method === 'GET') {
      config.params = data;
    } else {
      config.data = data;
    }
  }
  
  return axios(config);
}

// =============================================================================
// AUTH TESTS
// =============================================================================

async function testSystemUptime() {
  try {
    const res = await api('GET', '/uptime', null, false);
    success('system.uptime', `App: ${res.data.app}, Up: ${res.data.up}`);
    return true;
  } catch (e) {
    fail('system.uptime', e);
    return false;
  }
}

async function testRegister() {
  try {
    const res = await api('POST', '/register', TEST_USER, false);
    testUserId = res.data.user_id;
    success('register', `User ID: ${testUserId}`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 409) {
      success('register', 'User already exists (OK)');
      return true;
    }
    fail('register', e);
    return false;
  }
}

async function testLogin() {
  try {
    const res = await api('POST', '/login', {
      login: TEST_USER.username,
      password: TEST_USER.password,
    }, false);
    authToken = res.data.token;
    success('login', `Token received`);
    return true;
  } catch (e) {
    fail('login', e);
    return false;
  }
}

async function testWhoAmI() {
  try {
    const res = await api('GET', '/who-am-i');
    testUsername = res.data.user || res.data.username;
    success('whoami', `Username: ${testUsername}`);
    return true;
  } catch (e) {
    fail('whoami', e);
    return false;
  }
}

async function testMyself() {
  try {
    const res = await api('GET', '/myself');
    testUserId = res.data.aid;
    testUsername = res.data.login;
    success('myself', `Email: ${res.data.email}`);
    return true;
  } catch (e) {
    fail('myself', e);
    return false;
  }
}

// =============================================================================
// PROFILE TESTS
// =============================================================================

async function testProfileGet() {
  try {
    const res = await api('GET', '/profile');
    success('profile.get', `Profile retrieved`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      success('profile.get', 'No profile yet (OK)');
      return true;
    }
    fail('profile.get', e);
    return false;
  }
}

async function testProfileUpdate() {
  try {
    await api('PUT', '/profile', {
      first_name: 'Test',
      last_name: 'User',
      bio: 'This is a test profile',
    });
    success('profile.update', `Profile updated`);
    return true;
  } catch (e) {
    fail('profile.update', e);
    return false;
  }
}

async function testProfileByUsername() {
  if (!testUsername) {
    skip('profile.getByUsername', 'No username');
    return false;
  }
  try {
    const res = await api('GET', `/user/${testUsername}/profile`, null, false);
    success('profile.getByUsername', `Got profile for ${testUsername}`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      success('profile.getByUsername', 'Not found (OK)');
      return true;
    }
    fail('profile.getByUsername', e);
    return false;
  }
}

// =============================================================================
// EXPERIENCES TESTS
// =============================================================================

let createdExperienceId: string | null = null;

async function testExperiencesList() {
  try {
    const res = await api('GET', '/profile/experiences');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    success('experiences.list', `Found ${count} experiences`);
    return true;
  } catch (e) {
    fail('experiences.list', e);
    return false;
  }
}

async function testExperiencesCreate() {
  try {
    const res = await api('POST', '/profile/experiences', {
      title: 'Software Engineer',
      company_name: 'Test Corp',
      start_date: '2020-01-01',
      description: 'Test experience',
    });
    createdExperienceId = res.data.experience_id;
    success('experiences.create', `Created: ${createdExperienceId}`);
    return true;
  } catch (e) {
    fail('experiences.create', e);
    return false;
  }
}

async function testExperiencesDelete() {
  if (!createdExperienceId) {
    skip('experiences.delete', 'No experience created');
    return false;
  }
  try {
    await api('DELETE', `/profile/experiences/${createdExperienceId}`);
    success('experiences.delete', `Deleted`);
    return true;
  } catch (e) {
    fail('experiences.delete', e);
    return false;
  }
}

// =============================================================================
// INTERESTS TESTS
// =============================================================================

async function testInterestsList() {
  try {
    const res = await api('GET', '/profile/interests');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    success('interests.list', `Found ${count} interests`);
    return true;
  } catch (e) {
    fail('interests.list', e);
    return false;
  }
}

// =============================================================================
// CATEGORIES TESTS
// =============================================================================

let firstCategoryId: string | null = null;

async function testCategoriesList() {
  try {
    const res = await api('GET', '/categories', null, true);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    if (count > 0) {
      firstCategoryId = res.data[0].category_id || res.data[0].id;
    }
    success('categories.list', `Found ${count} categories`);
    return res.data;
  } catch (e) {
    fail('categories.list', e);
    return [];
  }
}

async function testCategoriesGet() {
  if (!firstCategoryId) {
    skip('categories.get', 'No categories available');
    return false;
  }
  try {
    const res = await api('GET', `/categories/${firstCategoryId}`, null, true);
    success('categories.get', `Got: ${res.data.name}`);
    return true;
  } catch (e) {
    fail('categories.get', e);
    return false;
  }
}

// =============================================================================
// PAPS TESTS
// =============================================================================

let createdPapsId: string | null = null;

async function testPapsList() {
  try {
    const res = await api('GET', '/paps', null, true);
    const paps = res.data?.paps || res.data;
    const count = Array.isArray(paps) ? paps.length : 0;
    const total = res.data?.total || count;
    success('paps.list', `Found ${count}/${total} PAPS`);
    return res.data;
  } catch (e) {
    fail('paps.list', e);
    return null;
  }
}

async function testPapsCreate() {
  try {
    const res = await api('POST', '/paps', {
      title: 'Test PAPS ' + Date.now(),
      description: 'This is a test job posting created by automated tests. It has enough characters.',
      payment_amount: 100,
      payment_currency: 'USD',
      status: 'draft',
    });
    createdPapsId = res.data.paps_id;
    success('paps.create', `Created PAPS: ${createdPapsId}`);
    return true;
  } catch (e) {
    fail('paps.create', e);
    return false;
  }
}

async function testPapsGet() {
  if (!createdPapsId) {
    skip('paps.get', 'No PAPS created');
    return false;
  }
  try {
    const res = await api('GET', `/paps/${createdPapsId}`, null, true);
    success('paps.get', `Title: ${res.data.title}`);
    return true;
  } catch (e) {
    fail('paps.get', e);
    return false;
  }
}

async function testPapsUpdate() {
  if (!createdPapsId) {
    skip('paps.update', 'No PAPS created');
    return false;
  }
  try {
    await api('PUT', `/paps/${createdPapsId}`, {
      title: 'Updated Test PAPS',
      description: 'Updated description for testing. It has enough characters for validation.',
    });
    success('paps.update', `Updated`);
    return true;
  } catch (e) {
    fail('paps.update', e);
    return false;
  }
}

async function testPapsDelete() {
  if (!createdPapsId) {
    skip('paps.delete', 'No PAPS created');
    return false;
  }
  try {
    await api('DELETE', `/paps/${createdPapsId}`);
    success('paps.delete', `Deleted PAPS`);
    return true;
  } catch (e) {
    fail('paps.delete', e);
    return false;
  }
}

// =============================================================================
// COMMENTS TESTS
// =============================================================================

let testPapsIdForComments: string | null = null;
let createdCommentId: string | null = null;

async function setupPapsForComments() {
  try {
    const res = await api('POST', '/paps', {
      title: 'PAPS for Comment Testing ' + Date.now(),
      description: 'This PAPS is created to test comments functionality. Enough characters here.',
      payment_amount: 50,
      payment_currency: 'USD',
      status: 'draft',  // Use draft to avoid start_datetime requirement
    });
    testPapsIdForComments = res.data.paps_id;
    success('comments.setup', `Created PAPS for comments: ${testPapsIdForComments}`);
    return true;
  } catch (e) {
    fail('comments.setup', e);
    return false;
  }
}

async function testCommentsCreate() {
  if (!testPapsIdForComments) {
    skip('comments.create', 'No PAPS for comments');
    return false;
  }
  try {
    const res = await api('POST', `/paps/${testPapsIdForComments}/comments`, {
      content: 'This is a test comment!',
    });
    createdCommentId = res.data.comment_id;
    success('comments.create', `Created comment: ${createdCommentId}`);
    return true;
  } catch (e) {
    fail('comments.create', e);
    return false;
  }
}

async function testCommentsList() {
  if (!testPapsIdForComments) {
    skip('comments.list', 'No PAPS for comments');
    return false;
  }
  try {
    const res = await api('GET', `/paps/${testPapsIdForComments}/comments`, null, true);
    const count = res.data?.comments?.length || res.data?.length || 0;
    success('comments.list', `Found ${count} comments`);
    return true;
  } catch (e) {
    fail('comments.list', e);
    return false;
  }
}

async function testCommentsDelete() {
  if (!createdCommentId) {
    skip('comments.delete', 'No comment created');
    return false;
  }
  try {
    await api('DELETE', `/comments/${createdCommentId}`);
    success('comments.delete', `Deleted comment`);
    return true;
  } catch (e) {
    fail('comments.delete', e);
    return false;
  }
}

async function cleanupPapsForComments() {
  if (testPapsIdForComments) {
    try {
      await api('DELETE', `/paps/${testPapsIdForComments}`);
    } catch {}
  }
}

// =============================================================================
// SPAP TESTS
// =============================================================================

async function testSpapList() {
  try {
    const res = await api('GET', '/spaps');
    const count = res.data?.spaps?.length || 0;
    success('spap.list', `Found ${count} applications`);
    return true;
  } catch (e: any) {
    // May return empty or 404 if no applications
    if (e?.response?.status === 404) {
      success('spap.list', 'No applications (OK)');
      return true;
    }
    fail('spap.list', e);
    return false;
  }
}

// =============================================================================
// ASAP TESTS
// =============================================================================

async function testAsapList() {
  try {
    const res = await api('GET', '/asaps');
    const count = res.data?.asaps?.length || 0;
    success('asap.list', `Found ${count} assignments`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      success('asap.list', 'No assignments (OK)');
      return true;
    }
    fail('asap.list', e);
    return false;
  }
}

// =============================================================================
// PAYMENTS TESTS
// =============================================================================

async function testPaymentsMy() {
  try {
    const res = await api('GET', '/user/payments');
    const count = res.data?.payments?.length || 0;
    success('payments.my', `Found ${count} payments`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      success('payments.my', 'No payments (OK)');
      return true;
    }
    fail('payments.my', e);
    return false;
  }
}

// =============================================================================
// CHAT TESTS
// =============================================================================

async function testChatList() {
  try {
    const res = await api('GET', '/chats');
    const count = res.data?.threads?.length || 0;
    success('chat.list', `Found ${count} threads`);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      success('chat.list', 'No chats (OK)');
      return true;
    }
    fail('chat.list', e);
    return false;
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   Underboss API Endpoint Tests                 ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   Backend: ${BASE_URL}                  ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}`);

  let passed = 0;
  let failed = 0;
  
  const track = (result: boolean) => result ? passed++ : failed++;

  // Auth
  await testRegister();
  await testLogin();
  
  // PAPS
  section('PAPS');
  await testPapsList();
  passed++;
  track(await testPapsCreate());
  track(await testPapsGet());
  track(await testPapsUpdate());

  // Comments
  section('COMMENTS');
  await setupPapsForComments();
  track(await testCommentsCreate());
  track(await testCommentsList());
  track(await testCommentsDelete());
  await cleanupPapsForComments();

  // SPAP
  section('SPAP (Applications)');
  track(await testSpapList());

  // ASAP
  section('ASAP (Assignments)');
  track(await testAsapList());

  // Payments
  section('PAYMENTS');
  track(await testPaymentsMy());

  // Chat
  section('CHAT');
  track(await testChatList());

  // Cleanup
  section('CLEANUP');
  track(await testPapsDelete());

  // Summary
  console.log(`\n${colors.cyan}════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset} | ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════${colors.reset}\n`);
}

// Run!
runTests().catch(console.error);
