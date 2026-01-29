/**
 * Categories module - Types for category management
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// CATEGORY ENTITY
// =============================================================================

/** Category */
export interface Category {
  category_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  parent_id: UUID | null;
  is_active: boolean;
  display_order: number;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** POST /categories */
export interface CategoryCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  icon_url?: string;
  parent_id?: UUID;
  is_active?: boolean;
  display_order?: number;
}

/** PUT /categories/{id} */
export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon_url?: string;
  parent_id?: UUID | null;
  is_active?: boolean;
  display_order?: number;
}

/** GET /categories params */
export interface CategoryListParams {
  parent_id?: UUID;
  active_only?: boolean;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** POST /categories response */
export interface CategoryCreateResponse {
  category_id: UUID;
}

/** POST /categories/{id}/icon response */
export interface CategoryIconResponse {
  icon_url: string;
}
