/**
 * Auth module - Request validators
 */

import type { RegisterRequest, LoginRequest } from './types';

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Validate registration request
 */
export function validateRegisterRequest(data: RegisterRequest): void {
  if (!data.username || typeof data.username !== 'string') {
    throw new Error('Username is required');
  }
  if (!USERNAME_REGEX.test(data.username)) {
    throw new Error('Username must be 3-50 chars, start with letter, contain only letters, numbers, dots, hyphens, underscores');
  }

  if (!data.email || typeof data.email !== 'string') {
    throw new Error('Email is required');
  }
  if (!EMAIL_REGEX.test(data.email)) {
    throw new Error('Invalid email format');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new Error('Password is required');
  }

  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    throw new Error('Phone must be in E.164 format (e.g., +1234567890)');
  }
}

/**
 * Validate login request
 */
export function validateLoginRequest(data: LoginRequest): void {
  if (!data.login || typeof data.login !== 'string') {
    throw new Error('Login is required');
  }
  if (!data.password || typeof data.password !== 'string') {
    throw new Error('Password is required');
  }
}
