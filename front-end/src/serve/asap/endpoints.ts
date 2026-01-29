/**
 * ASAP module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateAsapCreate, validateAsapUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
  multiFile?: boolean;
}

export const asapEndpoints: Record<string, EndpointConfig> = {
  // ASAP CRUD
  'asap.list': {
    method: 'GET',
    path: '/asaps',
    auth: true,
  },
  'asap.get': {
    method: 'GET',
    path: '/asaps/{asap_id}',
    auth: true,
  },
  'asap.create': {
    method: 'POST',
    path: '/asaps',
    auth: true,
    validate: validateAsapCreate,
  },
  'asap.update': {
    method: 'PATCH',
    path: '/asaps/{asap_id}',
    auth: true,
    validate: validateAsapUpdate,
  },
  'asap.delete': {
    method: 'DELETE',
    path: '/asaps/{asap_id}',
    auth: true,
  },

  // ASAP Media
  'asap.media.list': {
    method: 'GET',
    path: '/asaps/{asap_id}/media',
    auth: true,
  },
  'asap.media.upload': {
    method: 'POST',
    path: '/asaps/{asap_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'file',
    multiFile: true,
  },
  'asap.media.delete': {
    method: 'DELETE',
    path: '/asaps/{asap_id}/media/{media_id}',
    auth: true,
  },
};
