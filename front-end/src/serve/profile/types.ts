/**
 * Profile module - Types for profile, avatar, experiences, interests
 */

import type { UUID, ISODateTime, ISODate, ProficiencyLevel } from '../common/types';

// =============================================================================
// PROFILE
// =============================================================================

/** User profile */
export interface UserProfile {
  user_id: UUID;
  username: string;
  email?: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  date_of_birth: ISODate | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

/** PUT/PATCH /profile */
export interface ProfileUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  date_of_birth?: ISODate | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

// =============================================================================
// AVATAR
// =============================================================================

/** POST /profile/avatar response */
export interface AvatarUploadResponse {
  avatar_url: string;
}

// =============================================================================
// EXPERIENCES
// =============================================================================

/** Experience entry */
export interface Experience {
  experience_id: UUID;
  user_id: UUID;
  title: string;  // Backend uses 'title' not 'job_title'
  company_name: string;
  location: string | null;
  start_date: ISODate;
  end_date: ISODate | null;
  description: string | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
}

/** POST /profile/experiences */
export interface ExperienceCreateRequest {
  title: string;  // Backend uses 'title' not 'job_title'
  company_name: string;
  location?: string;
  start_date: ISODate;
  end_date?: ISODate;
  description?: string;
}

/** PUT /profile/experiences/{id} */
export interface ExperienceUpdateRequest {
  title?: string;  // Backend uses 'title' not 'job_title'
  company_name?: string;
  location?: string | null;
  start_date?: ISODate;
  end_date?: ISODate | null;
  description?: string | null;
}

/** POST /profile/experiences response */
export interface ExperienceCreateResponse {
  experience_id: UUID;
}

// =============================================================================
// INTERESTS
// =============================================================================

/** User interest (category link) */
export interface Interest {
  interest_id: UUID;
  user_id: UUID;
  category_id: UUID;
  category_name: string;
  category_slug: string;
  proficiency_level?: ProficiencyLevel;
  created_at: ISODateTime;
}

/** POST /profile/interests */
export interface InterestCreateRequest {
  category_id: UUID;
  proficiency_level?: ProficiencyLevel;
}

/** POST /profile/interests response */
export interface InterestCreateResponse {
  interest_id: UUID;
}
