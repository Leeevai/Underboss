/**
 * Profile module - Request validators
 */

import type { 
  ProfileUpdateRequest, 
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  InterestCreateRequest 
} from './types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
}

/**
 * Validate experience create request
 */
export function validateExperienceCreate(data: ExperienceCreateRequest): void {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Title is required');
  }

  if (!data.company_name || typeof data.company_name !== 'string') {
    throw new Error('Company name is required');
  }

  if (!data.start_date || !DATE_REGEX.test(data.start_date)) {
    throw new Error('Start date is required in YYYY-MM-DD format');
  }

  const startDate = new Date(data.start_date);
  if (startDate > new Date()) {
    throw new Error('Start date cannot be in the future');
  }

  if (data.end_date) {
    if (!DATE_REGEX.test(data.end_date)) {
      throw new Error('End date must be in YYYY-MM-DD format');
    }
    const endDate = new Date(data.end_date);
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }
  }
}

/**
 * Validate experience update request
 */
export function validateExperienceUpdate(data: ExperienceUpdateRequest): void {
  if (data.start_date && !DATE_REGEX.test(data.start_date)) {
    throw new Error('Start date must be in YYYY-MM-DD format');
  }

  if (data.end_date && !DATE_REGEX.test(data.end_date)) {
    throw new Error('End date must be in YYYY-MM-DD format');
  }

  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }
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
