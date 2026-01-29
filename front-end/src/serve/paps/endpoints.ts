/**
 * PAPS module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validatePapsCreate, validatePapsUpdate, validatePapsListParams, validateScheduleCreate } from './validators';

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
  // PAPS CRUD
  'paps.list': {
    method: 'GET',
    path: '/paps',
    auth: true,  // Backend requires auth
    validate: validatePapsListParams,
  },
  'paps.get': {
    method: 'GET',
    path: '/paps/{paps_id}',
    auth: true,  // Backend requires auth
  },
  'paps.create': {
    method: 'POST',
    path: '/paps',
    auth: true,
    validate: validatePapsCreate,
  },
  'paps.update': {
    method: 'PUT',
    path: '/paps/{paps_id}',
    auth: true,
    validate: validatePapsUpdate,
  },
  'paps.patch': {
    method: 'PATCH',
    path: '/paps/{paps_id}',
    auth: true,
    validate: validatePapsUpdate,
  },
  'paps.delete': {
    method: 'DELETE',
    path: '/paps/{paps_id}',
    auth: true,
  },

  // PAPS Media
  'paps.media.list': {
    method: 'GET',
    path: '/paps/{paps_id}/media',
    auth: false,
  },
  'paps.media.upload': {
    method: 'POST',
    path: '/paps/{paps_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'file',
    multiFile: true,
  },
  'paps.media.delete': {
    method: 'DELETE',
    path: '/paps/{paps_id}/media/{media_id}',
    auth: true,
  },

  // PAPS Schedule
  'paps.schedule.list': {
    method: 'GET',
    path: '/paps/{paps_id}/schedule',
    auth: false,
  },
  'paps.schedule.create': {
    method: 'POST',
    path: '/paps/{paps_id}/schedule',
    auth: true,
    validate: validateScheduleCreate,
  },
  'paps.schedule.delete': {
    method: 'DELETE',
    path: '/paps/{paps_id}/schedule/{schedule_id}',
    auth: true,
  },
};
