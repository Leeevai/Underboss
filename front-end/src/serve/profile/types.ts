/**
 * Profile module - Types for profile, avatar, experiences, interests
 * 
 * @module serve/profile/types
 */

import type { UUID, ISODateTime, ISODate, ProficiencyLevel, Gender } from '../common/types';

// =============================================================================
// PROFILE
// =============================================================================

/** 
 * User profile - Complete user profile data
 * 
 * @see GET /profile
 * @see GET /user/{username}/profile
 */
export interface UserProfile {
  user_id: UUID;
  username: string;
  email?: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  /** Gender: M=Male, F=Female, O=Other, N=Prefer not to say */
  gender: Gender | null;
  avatar_url: string | null;
  /** Date of birth in YYYY-MM-DD format */
  date_of_birth: ISODate | null;
  location_address: string | null;
  /** Latitude: -90 to 90 */
  location_lat: number | null;
  /** Longitude: -180 to 180 */
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

/** 
 * PUT/PATCH /profile - Update profile request
 * 
 * All fields are optional for PATCH, used in PUT to replace all fields
 */
export interface ProfileUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  /** Gender: M=Male, F=Female, O=Other, N=Prefer not to say */
  gender?: Gender | null;
  /** Date of birth in YYYY-MM-DD format */
  date_of_birth?: ISODate | null;
  location_address?: string | null;
  /** Latitude: -90 to 90 */
  location_lat?: number | null;
  /** Longitude: -180 to 180 */
  location_lng?: number | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

/** User rating info returned with profile */
export interface ProfileRatingResponse {
  rating_average: number;
  rating_count: number;
}

// =============================================================================
// AVATAR
// =============================================================================

/** 
 * POST /profile/avatar response 
 * 
 * Supported types: PNG, JPEG, JPG, GIF, WEBP
 * Max size: 5 MB
 */
export interface AvatarUploadResponse {
  avatar_url: string;
}

// =============================================================================
// EXPERIENCES
// =============================================================================

/** 
 * Work experience entry 
 * 
 * @see GET /profile/experiences
 */
export interface Experience {
  experience_id: UUID;
  user_id: UUID;
  /** Job title (2+ chars required) */
  title: string;
  /** Company name */
  company: string | null;
  /** Job description */
  description: string | null;
  /** Start date in ISO 8601 format */
  start_date: ISODateTime;
  /** End date - must be after start_date if provided */
  end_date: ISODateTime | null;
  /** Whether this is current job - cannot have end_date if true */
  is_current: boolean;
  /** Display order for sorting */
  display_order: number;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
}

/** 
 * POST /profile/experiences - Create experience request
 * 
 * Validation:
 * - title: At least 2 characters
 * - start_date: ISO 8601 format required
 * - end_date: Must be after start_date if provided
 * - Cannot have end_date if is_current is true
 */
export interface ExperienceCreateRequest {
  /** Job title (required, 2+ chars) */
  title: string;
  /** Company name */
  company?: string;
  /** Job description */
  description?: string;
  /** Start date in ISO 8601 format (required) */
  start_date: ISODateTime;
  /** End date - must be after start_date */
  end_date?: ISODateTime;
  /** Whether this is current job */
  is_current?: boolean;
  /** Display order for sorting */
  display_order?: number;
}

/** 
 * PATCH /profile/experiences/{exp_id} - Update experience request
 * 
 * All fields optional for partial update
 */
export interface ExperienceUpdateRequest {
  experience_id: UUID;  // Path parameter
  title?: string;
  company?: string | null;
  description?: string | null;
  start_date?: ISODateTime;
  end_date?: ISODateTime | null;
  is_current?: boolean;
  display_order?: number;
}

/** POST /profile/experiences response */
export interface ExperienceCreateResponse {
  experience_id: UUID;
}

// =============================================================================
// INTERESTS
// =============================================================================

/** 
 * User interest (category link) 
 * 
 * @see GET /profile/interests
 */
export interface Interest {
  category_id: UUID;
  category_name: string;
  category_slug: string;
  /** Proficiency level 1-5 */
  proficiency_level: ProficiencyLevel;
  created_at: ISODateTime;
}

/** 
 * POST /profile/interests - Add interest request
 * 
 * Error 409 if interest already exists
 */
export interface InterestCreateRequest {
  category_id: UUID;
  /** Proficiency level 1-5 (default: 1) */
  proficiency_level?: ProficiencyLevel;
}

/** 
 * PATCH /profile/interests/{category_id} - Update interest request
 */
export interface InterestUpdateRequest {
  category_id: UUID;  // Path parameter
  /** Proficiency level 1-5 (required) */
  proficiency_level: ProficiencyLevel;
}

/** POST /profile/interests response - returns empty body with 201 status */
export interface InterestCreateResponse {
  // Empty response - 201 status indicates success
}
