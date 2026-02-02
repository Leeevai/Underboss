/**
 * System module - Request validators
 * 
 * Admin user management validators (admin only endpoints)
 * 
 * @module serve/system/validators
 */

import type { AdminUserCreateRequest, AdminUserUpdateRequest, AdminUserReplaceRequest } from './types';

/** Username pattern: start with letter, 3+ chars, alphanumeric + ._- */
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,}$/;

/** Email pattern */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimum password length */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate admin user create request
 * 
 * POST /users (admin only)
 */
export function validateAdminUserCreate(data: AdminUserCreateRequest): void {
  // Login is required
  if (!data.login || typeof data.login !== 'string') {
    throw new Error('Login is required');
  }
  if (!USERNAME_REGEX.test(data.login)) {
    throw new Error('Login must be 3+ characters and start with a letter');
  }

  // Password is required
  if (!data.password || typeof data.password !== 'string') {
    throw new Error('Password is required');
  }
  if (data.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  // Email is optional but must be valid if provided
  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Phone is optional
  if (data.phone !== undefined && data.phone !== null && typeof data.phone !== 'string') {
    throw new Error('Phone must be a string');
  }

  // is_admin is optional, must be boolean if provided
  if (data.is_admin !== undefined && typeof data.is_admin !== 'boolean') {
    throw new Error('is_admin must be a boolean');
  }
}

/**
 * Validate admin user update request
 * 
 * PATCH /users/{user_id} (admin only)
 */
export function validateAdminUserUpdate(data: AdminUserUpdateRequest): void {
  // At least one field should be provided (partial update)
  const hasField = data.password !== undefined || 
                   data.email !== undefined || 
                   data.phone !== undefined || 
                   data.is_admin !== undefined;
  
  if (!hasField) {
    throw new Error('At least one field must be provided for update');
  }

  // Password validation if provided
  if (data.password !== undefined) {
    if (typeof data.password !== 'string' || data.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
  }

  // Email validation if provided
  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Phone validation if provided
  if (data.phone !== undefined && data.phone !== null && typeof data.phone !== 'string') {
    throw new Error('Phone must be a string');
  }

  // is_admin validation if provided
  if (data.is_admin !== undefined && typeof data.is_admin !== 'boolean') {
    throw new Error('is_admin must be a boolean');
  }
}

/**
 * Validate admin user replace request
 * 
 * PUT /users/{user_id} (admin only)
 */
export function validateAdminUserReplace(data: AdminUserReplaceRequest): void {
  // auth object is required
  if (!data.auth || typeof data.auth !== 'object') {
    throw new Error('Auth object is required');
  }

  // Login is required
  if (!data.auth.login || typeof data.auth.login !== 'string') {
    throw new Error('Login is required');
  }
  if (!USERNAME_REGEX.test(data.auth.login)) {
    throw new Error('Login must be 3+ characters and start with a letter');
  }

  // Password is required
  if (!data.auth.password || typeof data.auth.password !== 'string') {
    throw new Error('Password is required');
  }
  if (data.auth.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  // Email is optional but must be valid if provided
  if (data.auth.email !== undefined && data.auth.email !== null) {
    if (typeof data.auth.email !== 'string' || !EMAIL_REGEX.test(data.auth.email)) {
      throw new Error('Invalid email format');
    }
  }

  // isadmin is optional, must be boolean if provided
  if (data.auth.isadmin !== undefined && typeof data.auth.isadmin !== 'boolean') {
    throw new Error('isadmin must be a boolean');
