/**
 * Auth module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateRegisterRequest, validateLoginRequest } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const authEndpoints: Record<string, EndpointConfig> = {
  'register': {
    method: 'POST',
    path: '/register',
    auth: false,
    validate: validateRegisterRequest,
  },
  'login': {
    method: 'POST',
    path: '/login',
    auth: false,
    validate: validateLoginRequest,
  },
  'whoami': {
    method: 'GET',
    path: '/who-am-i',
    auth: true,
  },
  'myself': {
    method: 'GET',
    path: '/myself',
    auth: true,
  },
};
