/**
 * PAPS module - Endpoint definitions
 * 
 * @module serve/paps/endpoints
 */

import type { HttpMethod } from '../common/types';
import { 
  validatePapsCreate, 
  validatePapsUpdate, 
  validatePapsListParams, 
  validateScheduleCreate,
  validateScheduleUpdate,
  validatePapsStatusUpdate 
} from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
  multiFile?: boolean;
}

export const papsEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // PAPS CRUD
  // ==========================================================================
  
  /** GET /paps - List/search job postings */
  'paps.list': {
    method: 'GET',
    path: '/paps',
    auth: true,
    validate: validatePapsListParams,
  },
  
  /** GET /paps/{paps_id} - Get job posting details */
  'paps.get': {
    method: 'GET',
    path: '/paps/{paps_id}',
    auth: true,
  },
  
  /** POST /paps - Create job posting */
  'paps.create': {
    method: 'POST',
    path: '/paps',
    auth: true,
    validate: validatePapsCreate,
  },
  
  /** PUT /paps/{paps_id} - Update job posting */
  'paps.update': {
    method: 'PUT',
    path: '/paps/{paps_id}',
    auth: true,
    validate: validatePapsUpdate,
  },
  
  /** PUT /paps/{paps_id}/status - Update PAPS status only */
  'paps.updateStatus': {
    method: 'PUT',
    path: '/paps/{paps_id}/status',
    auth: true,
    validate: validatePapsStatusUpdate,
  },
  
  /** DELETE /paps/{paps_id} - Soft delete job posting */
  'paps.delete': {
    method: 'DELETE',
    path: '/paps/{paps_id}',
    auth: true,
  },

  // ==========================================================================
  // PAPS CATEGORIES
  // ==========================================================================
  
  /** POST /paps/{paps_id}/categories/{category_id} - Add category to PAPS */
  'paps.categories.add': {
    method: 'POST',
    path: '/paps/{paps_id}/categories/{category_id}',
    auth: true,
  },
  
  /** DELETE /paps/{paps_id}/categories/{category_id} - Remove category from PAPS */
  'paps.categories.remove': {
    method: 'DELETE',
    path: '/paps/{paps_id}/categories/{category_id}',
    auth: true,
  },

  // ==========================================================================
  // PAPS MEDIA
  // ==========================================================================
  
  /** GET /paps/{paps_id}/media - Get job media files */
  'paps.media.list': {
    method: 'GET',
    path: '/paps/{paps_id}/media',
    auth: true,
  },
  
  /** POST /paps/{paps_id}/media - Upload media (max 50MB, images/video/pdf) */
  'paps.media.upload': {
    method: 'POST',
    path: '/paps/{paps_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'media',
    multiFile: true,
  },
  
  /** DELETE /paps/media/{media_id} - Delete media file */
  'paps.media.delete': {
    method: 'DELETE',
    path: '/paps/media/{media_id}',
    auth: true,
  },

  // ==========================================================================
  // PAPS SCHEDULES
  // ==========================================================================
  
  /** GET /paps/{paps_id}/schedules - Get job schedules */
  'paps.schedule.list': {
    method: 'GET',
    path: '/paps/{paps_id}/schedules',
    auth: true,
  },
  
  /** POST /paps/{paps_id}/schedules - Create schedule */
  'paps.schedule.create': {
    method: 'POST',
    path: '/paps/{paps_id}/schedules',
    auth: true,
    validate: validateScheduleCreate,
  },
  
  /** GET /paps/{paps_id}/schedules/{schedule_id} - Get schedule details */
  'paps.schedule.get': {
    method: 'GET',
    path: '/paps/{paps_id}/schedules/{schedule_id}',
    auth: true,
  },
  
  /** PUT /paps/{paps_id}/schedules/{schedule_id} - Update schedule */
  'paps.schedule.update': {
    method: 'PUT',
    path: '/paps/{paps_id}/schedules/{schedule_id}',
    auth: true,
    validate: validateScheduleUpdate,
  },
  
  /** DELETE /paps/{paps_id}/schedules/{schedule_id} - Delete schedule */
  'paps.schedule.delete': {
    method: 'DELETE',
    path: '/paps/{paps_id}/schedules/{schedule_id}',
    auth: true,
  },
};
