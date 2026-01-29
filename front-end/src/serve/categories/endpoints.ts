/**
 * Categories module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateCategoryCreate, validateCategoryUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
}

export const categoryEndpoints: Record<string, EndpointConfig> = {
  'categories.list': {
    method: 'GET',
    path: '/categories',
    auth: true,  // Backend requires auth
  },
  'categories.get': {
    method: 'GET',
    path: '/categories/{category_id}',
    auth: true,  // Backend requires auth
  },
  'categories.create': {
    method: 'POST',
    path: '/categories',
    auth: true,  // Admin only
    validate: validateCategoryCreate,
  },
  'categories.update': {
    method: 'PUT',
    path: '/categories/{category_id}',
    auth: true,  // Admin only
    validate: validateCategoryUpdate,
  },
  'categories.delete': {
    method: 'DELETE',
    path: '/categories/{category_id}',
    auth: true,  // Admin only
  },
  'categories.iconUpload': {
    method: 'POST',
    path: '/categories/{category_id}/icon',
    auth: true,  // Admin only
    isFileUpload: true,
    fileField: 'image',
  },
  'categories.iconGet': {
    method: 'GET',
    path: '/categories/{category_id}/icon',
    auth: false,
  },
  'categories.iconDelete': {
    method: 'DELETE',
    path: '/categories/{category_id}/icon',
    auth: true,  // Admin only
  },
};
