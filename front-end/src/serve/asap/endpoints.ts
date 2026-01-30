/**
 * ASAP module - Endpoint definitions
 * 
 * ASAP = Job Assignment (accepted application)
 * Routes use /asap/ (singular)
 */

import type { HttpMethod } from '../common/types';
import { validateAsapStatusUpdate } from './validators';

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
  /** GET /asap - Get current user's assignments */
  'asap.my': {
    method: 'GET',
    path: '/asap',
    auth: true,
  },
  
  /** GET /paps/{paps_id}/assignments - Get assignments for a PAPS (owner only) */
  'asap.listByPaps': {
    method: 'GET',
    path: '/paps/{paps_id}/assignments',
    auth: true,
  },
  
  /** GET /asap/{asap_id} - Get specific assignment */
  'asap.get': {
    method: 'GET',
    path: '/asap/{asap_id}',
    auth: true,
  },
  
  /** PUT /asap/{asap_id}/status - Update assignment status */
  'asap.updateStatus': {
    method: 'PUT',
    path: '/asap/{asap_id}/status',
    auth: true,
    validate: validateAsapStatusUpdate,
  },
  
  /** DELETE /asap/{asap_id} - Delete assignment */
  'asap.delete': {
    method: 'DELETE',
    path: '/asap/{asap_id}',
    auth: true,
  },

  // ASAP Media
  /** GET /asap/{asap_id}/media - Get assignment media */
  'asap.media.list': {
    method: 'GET',
    path: '/asap/{asap_id}/media',
    auth: true,
  },
  
  /** POST /asap/{asap_id}/media - Upload assignment media */
  'asap.media.upload': {
    method: 'POST',
    path: '/asap/{asap_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'media',
    multiFile: true,
  },
  
  /** DELETE /asap/media/{media_id} - Delete assignment media */
  'asap.media.delete': {
    method: 'DELETE',
    path: '/asap/media/{media_id}',
    auth: true,
  },
  
  // ASAP Rating
  /** POST /asap/{asap_id}/rate - Rate user for completed assignment */
  'asap.rate': {
    method: 'POST',
    path: '/asap/{asap_id}/rate',
    auth: true,
  },
  
  /** GET /asap/{asap_id}/can-rate - Check if can rate */
  'asap.canRate': {
    method: 'GET',
    path: '/asap/{asap_id}/can-rate',
    auth: true,
  },
  
  // ASAP Chat
  /** GET /asap/{asap_id}/chat - Get chat thread for assignment */
  'asap.chat': {
    method: 'GET',
    path: '/asap/{asap_id}/chat',
    auth: true,
  },
};
