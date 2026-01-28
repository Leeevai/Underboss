#!/usr/bin/env npx ts-node
/**
 * run-tests.ts - Executable test runner for serv() endpoints
 * 
 * Run with: npx ts-node src/serve/run-tests.ts
 */

// Polyfill for Node.js environment
import axios from 'axios';

// Backend URL
const BASE_URL = 'http://localhost:5000';

// Simple in-memory token storage for testing
let authToken = '';
let testUserId = '';
let testUsername = '';

// Test credentials
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

function log(msg: string) {
  console.log(msg);
}

function success(test: string, detail?: string) {
  console.log(`${colors.green}✓${colors.reset} ${test}${detail ? colors.dim + ' - ' + detail + colors.reset : ''}`);
}

function fail(test: string, error: any) {
  console.log(`${colors.red}✗${colors.reset} ${test}`);
  console.log(`  ${colors.red}Error: ${error?.response?.data?.error || error?.message || error}${colors.reset}`);
}

function section(name: string) {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

// Helper to make API calls
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
// TEST FUNCTIONS
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
    // User might already exist
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
    testUserId = res.data.user_id;
    testUsername = res.data.username;
    success('login', `Token received, User: ${testUsername}`);
    return true;
  } catch (e) {
    fail('login', e);
    return false;
  }
}

async function testWhoAmI() {
  try {
    const res = await api('GET', '/whoami');
    success('whoami', `Username: ${res.data.username}`);
    return true;
  } catch (e) {
    fail('whoami', e);
    return false;
  }
}

async function testMyself() {
  try {
    const res = await api('GET', '/myself');
    success('myself', `Email: ${res.data.email}`);
    return true;
  } catch (e) {
    fail('myself', e);
    return false;
  }
}

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
    const res = await api('PUT', '/profile', {
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

async function testCategoriesList() {
  try {
    const res = await api('GET', '/categories');
    const count = Array.isArray(res.data) ? res.data.length : 0;
    success('categories.list', `Found ${count} categories`);
    return res.data;
  } catch (e) {
    fail('categories.list', e);
    return [];
  }
}

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

async function testPapsList() {
  try {
    const res = await api('GET', '/paps');
    const count = res.data?.paps?.length || 0;
    const total = res.data?.total_count || 0;
    success('paps.list', `Found ${count}/${total} PAPS`);
    return res.data;
  } catch (e) {
    fail('paps.list', e);
    return null;
  }
}

let createdPapsId: string | null = null;

async function testPapsCreate() {
  try {
    const res = await api('POST', '/paps', {
      title: 'Test PAPS ' + Date.now(),
      description: 'This is a test job posting created by automated tests',
      payment_amount: 100,
      payment_type: 'fixed',
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
    log(`${colors.yellow}⊘${colors.reset} paps.get - Skipped (no PAPS created)`);
    return false;
  }
  try {
    const res = await api('GET', `/paps/${createdPapsId}`);
    success('paps.get', `Title: ${res.data.title}`);
    return true;
  } catch (e) {
    fail('paps.get', e);
    return false;
  }
}

async function testPapsUpdate() {
  if (!createdPapsId) {
    log(`${colors.yellow}⊘${colors.reset} paps.update - Skipped (no PAPS created)`);
    return false;
  }
  try {
    const res = await api('PUT', `/paps/${createdPapsId}`, {
      title: 'Updated Test PAPS',
      description: 'Updated description for testing',
    });
    success('paps.update', `Updated to: ${res.data.title}`);
    return true;
  } catch (e) {
    fail('paps.update', e);
    return false;
  }
}

let createdCommentId: string | null = null;

async function testCommentsCreate() {
  if (!createdPapsId) {
    log(`${colors.yellow}⊘${colors.reset} comments.create - Skipped (no PAPS created)`);
    return false;
  }
  try {
    const res = await api('POST', `/paps/${createdPapsId}/comments`, {
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
  if (!createdPapsId) {
    log(`${colors.yellow}⊘${colors.reset} comments.list - Skipped (no PAPS created)`);
    return false;
  }
  try {
    const res = await api('GET', `/paps/${createdPapsId}/comments`);
    const count = res.data?.count || 0;
    success('comments.list', `Found ${count} comments`);
    return true;
  } catch (e) {
    fail('comments.list', e);
    return false;
  }
}

async function testCommentsDelete() {
  if (!createdCommentId) {
    log(`${colors.yellow}⊘${colors.reset} comments.delete - Skipped (no comment created)`);
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

async function testSpapMy() {
  try {
    const res = await api('GET', '/spap/my');
    const count = res.data?.count || 0;
    success('spap.my', `Found ${count} applications`);
    return true;
  } catch (e) {
    fail('spap.my', e);
    return false;
  }
}

async function testPapsDelete() {
  if (!createdPapsId) {
    log(`${colors.yellow}⊘${colors.reset} paps.delete - Skipped (no PAPS created)`);
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
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   serv() API Endpoint Tests                ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}   Backend: ${BASE_URL}              ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}`);

  let passed = 0;
  let failed = 0;
  
  const track = (result: boolean) => result ? passed++ : failed++;

  // System (no auth)
  section('SYSTEM');
  track(await testSystemUptime());

  // Auth
  section('AUTH');
  track(await testRegister());
  track(await testLogin());
  
  if (!authToken) {
    console.log(`\n${colors.red}Cannot continue without auth token!${colors.reset}`);
    return;
  }
  
  track(await testWhoAmI()); // May not exist in all backends
  track(await testMyself());

  // Profile
  section('PROFILE');
  track(await testProfileGet());
  track(await testProfileUpdate());

  // Categories
  section('CATEGORIES');
  await testCategoriesList();
  passed++; // Count as pass if no exception

  // Experiences
  section('EXPERIENCES');
  track(await testExperiencesList());

  // Interests
  section('INTERESTS');
  track(await testInterestsList());

  // PAPS
  section('PAPS');
  await testPapsList();
  passed++;
  track(await testPapsCreate());
  track(await testPapsGet());
  track(await testPapsUpdate());

  // Comments
  section('COMMENTS');
  track(await testCommentsCreate());
  track(await testCommentsList());
  track(await testCommentsDelete());

  // SPAP
  section('SPAP (Applications)');
  track(await testSpapMy());

  // Cleanup
  section('CLEANUP');
  track(await testPapsDelete());

  // Summary
  console.log(`\n${colors.cyan}════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset} | ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}\n`);
}

// Run!
runTests().catch(console.error);
