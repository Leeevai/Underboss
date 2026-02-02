/**
 * PAPS module - Request validators
 * 
 * @module serve/paps/validators
 */

import type { 
  PapsCreateRequest, 
  PapsUpdateRequest, 
  PapsListParams, 
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  PapsStatusUpdateRequest
} from './types';

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const VALID_STATUSES = ['draft', 'published', 'open', 'closed', 'cancelled'];
const VALID_PAYMENT_TYPES = ['fixed', 'hourly', 'negotiable'];
const VALID_RECURRENCE_RULES = ['daily', 'weekly', 'monthly', 'yearly', 'cron'];

/**
 * Validate PAPS list params
 */
export function validatePapsListParams(data: PapsListParams): void {
  if (data.lat !== undefined) {
    if (data.lat < -90 || data.lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
  }

  if (data.lng !== undefined) {
    if (data.lng < -180 || data.lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  if (data.max_distance !== undefined && data.max_distance <= 0) {
    throw new Error('Max distance must be positive');
  }

  if (data.min_price !== undefined && data.min_price < 0) {
    throw new Error('Minimum price cannot be negative');
  }

  if (data.max_price !== undefined && data.max_price < 0) {
    throw new Error('Maximum price cannot be negative');
  }

  if (data.payment_type !== undefined && !VALID_PAYMENT_TYPES.includes(data.payment_type)) {
    throw new Error('Payment type must be: fixed, hourly, or negotiable');
  }

  if (data.limit !== undefined && data.limit <= 0) {
    throw new Error('Limit must be positive');
  }

  if (data.offset !== undefined && data.offset < 0) {
    throw new Error('Offset cannot be negative');
  }
}

/**
 * Validate PAPS create request
 */
export function validatePapsCreate(data: PapsCreateRequest): void {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Title is required');
  }
  if (data.title.length < 5 || data.title.length > 200) {
    throw new Error('Title must be 5-200 characters');
  }

  if (!data.description || typeof data.description !== 'string') {
    throw new Error('Description is required');
  }
  if (data.description.length < 20 || data.description.length > 5000) {
    throw new Error('Description must be 20-5000 characters');
  }

  if (data.payment_amount === undefined || data.payment_amount <= 0) {
    throw new Error('Payment amount is required and must be positive');
  }

  if (data.payment_type !== undefined && !VALID_PAYMENT_TYPES.includes(data.payment_type)) {
    throw new Error('Payment type must be: fixed, hourly, or negotiable');
  }

  if (data.max_applicants !== undefined) {
    if (data.max_applicants < 1 || data.max_applicants > 100) {
      throw new Error('Max applicants must be between 1 and 100');
    }
  }

  if (data.max_assignees !== undefined && data.max_applicants !== undefined) {
    if (data.max_assignees > data.max_applicants) {
      throw new Error('Max assignees cannot exceed max applicants');
    }
  }

  if (data.location_lat !== undefined && (data.location_lat < -90 || data.location_lat > 90)) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (data.location_lng !== undefined && (data.location_lng < -180 || data.location_lng > 180)) {
    throw new Error('Longitude must be between -180 and 180');
  }

  // Both lat and lng required if one is provided
  if ((data.location_lat !== undefined) !== (data.location_lng !== undefined)) {
    throw new Error('Both latitude and longitude are required if one is provided');
  }

  if (data.start_datetime && !ISO_DATETIME_REGEX.test(data.start_datetime)) {
    throw new Error('Start datetime must be ISO 8601 format');
  }

  if (data.end_datetime) {
    if (!ISO_DATETIME_REGEX.test(data.end_datetime)) {
      throw new Error('End datetime must be ISO 8601 format');
    }
    if (data.start_datetime && new Date(data.end_datetime) <= new Date(data.start_datetime)) {
      throw new Error('End datetime must be after start datetime');
    }
  }

  if (data.estimated_duration_minutes !== undefined && data.estimated_duration_minutes <= 0) {
    throw new Error('Estimated duration must be positive');
  }

  if (data.status === 'published' && !data.start_datetime) {
    throw new Error('Start datetime is required for published status');
  }

  if (data.payment_currency && data.payment_currency.length !== 3) {
    throw new Error('Payment currency must be 3-letter code (e.g., USD)');
  }

  if (data.expires_at) {
    if (!ISO_DATETIME_REGEX.test(data.expires_at)) {
      throw new Error('Expires at must be ISO 8601 format');
    }
  }
}

/**
 * Validate PAPS update request
 */
export function validatePapsUpdate(data: PapsUpdateRequest): void {
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.length < 5 || data.title.length > 200) {
      throw new Error('Title must be 5-200 characters');
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.length < 20 || data.description.length > 5000) {
      throw new Error('Description must be 20-5000 characters');
    }
  }

  if (data.location_lat !== undefined && data.location_lat !== null) {
    if (data.location_lat < -90 || data.location_lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
  }

  if (data.location_lng !== undefined && data.location_lng !== null) {
    if (data.location_lng < -180 || data.location_lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  if (data.payment_amount !== undefined && data.payment_amount !== null && data.payment_amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  if (data.payment_type !== undefined && !VALID_PAYMENT_TYPES.includes(data.payment_type)) {
    throw new Error('Payment type must be: fixed, hourly, or negotiable');
  }

  if (data.max_applicants !== undefined) {
    if (data.max_applicants < 1 || data.max_applicants > 100) {
      throw new Error('Max applicants must be between 1 and 100');
    }
  }

  if (data.start_datetime && !ISO_DATETIME_REGEX.test(data.start_datetime)) {
    throw new Error('Start datetime must be ISO 8601 format');
  }

  if (data.end_datetime && !ISO_DATETIME_REGEX.test(data.end_datetime)) {
    throw new Error('End datetime must be ISO 8601 format');
  }
}

/**
 * Validate PAPS status update request
 */
export function validatePapsStatusUpdate(data: PapsStatusUpdateRequest): void {
  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    throw new Error('Status must be one of: draft, open, published, closed, cancelled');
  }
}

/**
 * Validate schedule create request
 */
export function validateScheduleCreate(data: ScheduleCreateRequest): void {
  if (!data.recurrence_rule) {
    throw new Error('Recurrence rule is required');
  }

  const rule = data.recurrence_rule.toLowerCase();
  if (!VALID_RECURRENCE_RULES.includes(rule)) {
    throw new Error('Recurrence rule must be: daily, weekly, monthly, yearly, or cron');
  }

  if (rule === 'cron' && !data.cron_expression) {
    throw new Error('Cron expression is required when recurrence_rule is cron');
  }

  if (data.start_date && !ISO_DATETIME_REGEX.test(data.start_date)) {
    throw new Error('Start date must be ISO 8601 format');
  }

  if (data.end_date) {
    if (!ISO_DATETIME_REGEX.test(data.end_date)) {
      throw new Error('End date must be ISO 8601 format');
    }
    if (data.start_date && new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error('End date must be after or equal to start date');
    }
  }
}

/**
 * Validate schedule update request
 */
export function validateScheduleUpdate(data: ScheduleUpdateRequest): void {
  if (data.recurrence_rule !== undefined) {
    const rule = data.recurrence_rule.toLowerCase();
    if (!VALID_RECURRENCE_RULES.includes(rule)) {
      throw new Error('Recurrence rule must be: daily, weekly, monthly, yearly, or cron');
    }
  }

  if (data.start_date && !ISO_DATETIME_REGEX.test(data.start_date)) {
    throw new Error('Start date must be ISO 8601 format');
  }

  if (data.end_date && !ISO_DATETIME_REGEX.test(data.end_date)) {
    throw new Error('End date must be ISO 8601 format');
  }
}
