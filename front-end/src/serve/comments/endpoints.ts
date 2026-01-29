/**
 * Comments module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateCommentCreate, validateCommentUpdate, validateCommentListParams } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const commentEndpoints: Record<string, EndpointConfig> = {
  // Comments on PAPS
  'comments.list': {
    method: 'GET',
    path: '/paps/{paps_id}/comments',
    auth: true,  // Backend requires auth
    validate: validateCommentListParams,
  },
  'comments.create': {
    method: 'POST',
    path: '/paps/{paps_id}/comments',
    auth: true,
    validate: validateCommentCreate,
  },

  // Comment CRUD
  'comments.get': {
    method: 'GET',
    path: '/comments/{comment_id}',
    auth: true,  // Backend requires auth
  },
  'comments.update': {
    method: 'PATCH',
    path: '/comments/{comment_id}',
    auth: true,
    validate: validateCommentUpdate,
  },
  'comments.delete': {
    method: 'DELETE',
    path: '/comments/{comment_id}',
    auth: true,
  },
};
