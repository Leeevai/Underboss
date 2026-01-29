/**
 * System module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateAdminUserCreate, validateAdminUserUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const systemEndpoints: Record<string, EndpointConfig> = {
  // System info
  'system.uptime': {
    method: 'GET',
    path: '/uptime',
    auth: false,
  },
  'system.info': {
    method: 'GET',
    path: '/info',
    auth: true,  // Admin only
  },
  'system.stats': {
    method: 'GET',
    path: '/stats',
    auth: true,  // Admin only
  },

  // Admin user management
  'admin.users.list': {
    method: 'GET',
    path: '/users',
    auth: true,  // Admin only
  },
  'admin.users.create': {
    method: 'POST',
    path: '/users',
    auth: true,  // Admin only
    validate: validateAdminUserCreate,
  },
  'admin.users.get': {
    method: 'GET',
    path: '/users/{user_id}',
    auth: true,  // Admin only
  },
  'admin.users.update': {
    method: 'PATCH',
    path: '/users/{user_id}',
    auth: true,  // Admin only
    validate: validateAdminUserUpdate,
  },
  'admin.users.replace': {
    method: 'PUT',
    path: '/users/{user_id}',
    auth: true,  // Admin only
  },
  'admin.users.delete': {
    method: 'DELETE',
    path: '/users/{user_id}',
    auth: true,  // Admin only
  },
};
