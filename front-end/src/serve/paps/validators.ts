/**
 * PAPS module - Request validators
 */

import type { PapsCreateRequest, PapsUpdateRequest, PapsListParams, ScheduleCreateRequest } from './types';

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/**
 * Validate PAPS list params
 */
export function validatePapsListParams(data: PapsListParams): void {
  if (data.location_lat !== undefined) {
    if (data.location_lat < -90 || data.location_lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
  }

  if (data.location_lng !== undefined) {
    if (data.location_lng < -180 || data.location_lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  if (data.radius_km !== undefined && data.radius_km <= 0) {
    throw new Error('Radius must be positive');
  }

  if (data.min_payment !== undefined && data.min_payment < 0) {
    throw new Error('Minimum payment cannot be negative');
  }

  if (data.max_payment !== undefined && data.max_payment < 0) {
    throw new Error('Maximum payment cannot be negative');
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
  if (data.description.length < 10 || data.description.length > 5000) {
    throw new Error('Description must be 10-5000 characters');
  }

  if (data.location_lat !== undefined && (data.location_lat < -90 || data.location_lat > 90)) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (data.location_lng !== undefined && (data.location_lng < -180 || data.location_lng > 180)) {
    throw new Error('Longitude must be between -180 and 180');
  }

  if (data.payment_amount !== undefined && data.payment_amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  if (data.payment_currency && data.payment_currency.length !== 3) {
    throw new Error('Payment currency must be 3-letter code (e.g., USD)');
  }

  if (data.expires_at) {
    if (!ISO_DATETIME_REGEX.test(data.expires_at)) {
      throw new Error('Expires at must be ISO 8601 format');
    }
    if (new Date(data.expires_at) <= new Date()) {
      throw new Error('Expires at must be in the future');
    }
  }

  if (data.schedule) {
    data.schedule.forEach((s, i) => validateScheduleCreate(s, `schedule[${i}]`));
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
    if (typeof data.description !== 'string' || data.description.length < 10 || data.description.length > 5000) {
      throw new Error('Description must be 10-5000 characters');
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
}

/**
 * Validate schedule create request
 */
export function validateScheduleCreate(data: ScheduleCreateRequest, prefix = ''): void {
  const p = prefix ? `${prefix}.` : '';

  if (!data.start_time || !ISO_DATETIME_REGEX.test(data.start_time)) {
    throw new Error(`${p}start_time is required and must be ISO 8601 format`);
  }

  if (!data.end_time || !ISO_DATETIME_REGEX.test(data.end_time)) {
    throw new Error(`${p}end_time is required and must be ISO 8601 format`);
  }

  if (new Date(data.end_time) <= new Date(data.start_time)) {
    throw new Error(`${p}end_time must be after start_time`);
  }
}
