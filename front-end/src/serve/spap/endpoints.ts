/**
 * SPAP module - Endpoint definitions
 * 
 * SPAP = Job Application
 * Routes use /spap/ (singular) for specific applications
 * Routes use /paps/{paps_id}/apply for creating applications
 */

import type { HttpMethod } from '../common/types';
import { validateSpapApply } from './validators';

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
  /** GET /spap/my - Get current user's applications */
  'spap.my': {
    method: 'GET',
    path: '/spap/my',
    auth: true,
  },
  
  /** GET /paps/{paps_id}/applications - Get applications for a PAPS (owner only) */
  'spap.listByPaps': {
    method: 'GET',
    path: '/paps/{paps_id}/applications',
    auth: true,
  },
  
  /** GET /spap/{spap_id} - Get specific application details */
  'spap.get': {
    method: 'GET',
    path: '/spap/{spap_id}',
    auth: true,
  },
  
  /** POST /paps/{paps_id}/apply - Apply to a job posting */
  'spap.apply': {
    method: 'POST',
    path: '/paps/{paps_id}/apply',
    auth: true,
    validate: validateSpapApply,
  },
  
  /** DELETE /spap/{spap_id} - Withdraw application */
  'spap.withdraw': {
    method: 'DELETE',
    path: '/spap/{spap_id}',
    auth: true,
  },
  
  /** PUT /spap/{spap_id}/accept - Accept application (owner only) */
  'spap.accept': {
    method: 'PUT',
    path: '/spap/{spap_id}/accept',
    auth: true,
  },
  
  /** PUT /spap/{spap_id}/reject - Reject application (owner only) */
  'spap.reject': {
    method: 'PUT',
    path: '/spap/{spap_id}/reject',
    auth: true,
  },

  // SPAP Media
  /** GET /spap/{spap_id}/media - Get application media */
  'spap.media.list': {
    method: 'GET',
    path: '/spap/{spap_id}/media',
    auth: true,
  },
  
  /** POST /spap/{spap_id}/media - Upload application media */
  'spap.media.upload': {
    method: 'POST',
    path: '/spap/{spap_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'media',
    multiFile: true,
  },
  
  /** DELETE /spap/media/{media_id} - Delete application media */
  'spap.media.delete': {
    method: 'DELETE',
    path: '/spap/media/{media_id}',
    auth: true,
  },
  
  // SPAP Chat
  /** GET /spap/{spap_id}/chat - Get chat thread for application */
  'spap.chat': {
    method: 'GET',
    path: '/spap/{spap_id}/chat',
    auth: true,
  },
};
