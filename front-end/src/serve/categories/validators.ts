/**
 * Categories module - Request validators
 */

import type { CategoryCreateRequest, CategoryUpdateRequest } from './types';

const SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Validate category create request
 */
export function validateCategoryCreate(data: CategoryCreateRequest): void {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Category name is required');
  }
  if (data.name.length < 1 || data.name.length > 100) {
    throw new Error('Category name must be 1-100 characters');
  }

  if (data.slug && !SLUG_REGEX.test(data.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (data.description && data.description.length > 500) {
    throw new Error('Description must be max 500 characters');
  }
}

/**
 * Validate category update request
 */
export function validateCategoryUpdate(data: CategoryUpdateRequest): void {
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.length < 1 || data.name.length > 100) {
      throw new Error('Category name must be 1-100 characters');
    }
  }

  if (data.slug && !SLUG_REGEX.test(data.slug)) {
    throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (data.description && data.description.length > 500) {
    throw new Error('Description must be max 500 characters');
  }
}
