/**
 * SPAP module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateSpapCreate, validateSpapUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
  multiFile?: boolean;
}

export const spapEndpoints: Record<string, EndpointConfig> = {
  // SPAP CRUD
  'spap.list': {
    method: 'GET',
    path: '/spaps',
    auth: true,
  },
  'spap.get': {
    method: 'GET',
    path: '/spaps/{spap_id}',
    auth: true,
  },
  'spap.create': {
    method: 'POST',
    path: '/spaps',
    auth: true,
    validate: validateSpapCreate,
  },
  'spap.update': {
    method: 'PATCH',
    path: '/spaps/{spap_id}',
    auth: true,
    validate: validateSpapUpdate,
  },
  'spap.delete': {
    method: 'DELETE',
    path: '/spaps/{spap_id}',
    auth: true,
  },

  // SPAP Media
  'spap.media.list': {
    method: 'GET',
    path: '/spaps/{spap_id}/media',
    auth: true,
  },
  'spap.media.upload': {
    method: 'POST',
    path: '/spaps/{spap_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'file',
    multiFile: true,
  },
  'spap.media.delete': {
    method: 'DELETE',
    path: '/spaps/{spap_id}/media/{media_id}',
    auth: true,
  },
};
