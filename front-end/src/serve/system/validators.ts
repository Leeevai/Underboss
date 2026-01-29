/**
 * System module - Request validators
 */

import type { AdminUserCreateRequest, AdminUserUpdateRequest } from './types';

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate admin user create request
 */
export function validateAdminUserCreate(data: AdminUserCreateRequest): void {
  if (!data.login || typeof data.login !== 'string') {
    throw new Error('Login is required');
  }
  if (!USERNAME_REGEX.test(data.login)) {
    throw new Error('Login must be 3+ chars and start with letter');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new Error('Password is required');
  }

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    throw new Error('Invalid email format');
  }
}

/**
 * Validate admin user update request
 */
export function validateAdminUserUpdate(data: AdminUserUpdateRequest): void {
  if (data.email && !EMAIL_REGEX.test(data.email)) {
    throw new Error('Invalid email format');
  }
}
