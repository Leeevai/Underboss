/**
 * Profile module - Request validators
 * 
 * @module serve/profile/validators
 */

import type { 
  ProfileUpdateRequest, 
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  InterestCreateRequest,
  InterestUpdateRequest
} from './types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
const VALID_GENDERS = ['M', 'F', 'O', 'N'];

/**
 * Validate profile update request
 */
export function validateProfileUpdate(data: ProfileUpdateRequest): void {
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

  if (data.date_of_birth !== undefined && data.date_of_birth !== null) {
    if (!DATE_REGEX.test(data.date_of_birth)) {
      throw new Error('Date of birth must be in YYYY-MM-DD format');
    }
    const dob = new Date(data.date_of_birth);
    if (dob > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }
  }

  if (data.gender !== undefined && data.gender !== null) {
    if (!VALID_GENDERS.includes(data.gender)) {
      throw new Error('Gender must be one of: M (Male), F (Female), O (Other), N (Prefer not to say)');
    }
  }
}

/**
 * Validate experience create request
 */
export function validateExperienceCreate(data: ExperienceCreateRequest): void {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Title is required');
  }
  if (data.title.length < 2) {
    throw new Error('Title must be at least 2 characters');
  }

  if (!data.start_date || !ISO_DATETIME_REGEX.test(data.start_date)) {
    throw new Error('Start date is required in ISO 8601 format');
  }

  if (data.end_date) {
    if (!ISO_DATETIME_REGEX.test(data.end_date)) {
      throw new Error('End date must be in ISO 8601 format');
    }
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }
  }

  // Cannot have end_date if is_current is true
  if (data.is_current && data.end_date) {
    throw new Error('Cannot have end date if is_current is true');
  }
}

/**
 * Validate experience update request
 */
export function validateExperienceUpdate(data: ExperienceUpdateRequest): void {
  if (data.title !== undefined && data.title !== null) {
    if (data.title.length < 2) {
      throw new Error('Title must be at least 2 characters');
    }
  }

  if (data.start_date && !ISO_DATETIME_REGEX.test(data.start_date)) {
    throw new Error('Start date must be in ISO 8601 format');
  }

  if (data.end_date && !ISO_DATETIME_REGEX.test(data.end_date)) {
    throw new Error('End date must be in ISO 8601 format');
  }

  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }
  }

  // Cannot have end_date if is_current is true
  if (data.is_current && data.end_date) {
    throw new Error('Cannot have end date if is_current is true');
  }
}

/**
 * Validate interest create request
 */
export function validateInterestCreate(data: InterestCreateRequest): void {
  if (!data.category_id || typeof data.category_id !== 'string') {
    throw new Error('Category ID is required');
  }

  if (data.proficiency_level !== undefined) {
    if (data.proficiency_level < 1 || data.proficiency_level > 5) {
      throw new Error('Proficiency level must be between 1 and 5');
    }
  }
}

/**
 * Validate interest update request
 */
export function validateInterestUpdate(data: InterestUpdateRequest): void {
  if (data.proficiency_level === undefined) {
    throw new Error('Proficiency level is required');
  }
  if (data.proficiency_level < 1 || data.proficiency_level > 5) {
    throw new Error('Proficiency level must be between 1 and 5');
  }
}
