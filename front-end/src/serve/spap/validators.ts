/**
 * SPAP module - Request validators
 */

import type { SpapApplyRequest } from './types';

/**
 * Validate SPAP apply request
 * All fields are optional for the apply request
 */
export function validateSpapApply(data: SpapApplyRequest): void {
  // proposed_payment must be >= 0 if provided
  if (data.proposed_payment !== undefined) {
    if (typeof data.proposed_payment !== 'number' || data.proposed_payment < 0) {
      throw new Error('Proposed payment must be a non-negative number');
    }
  }
  
  // location_lat must be -90 to 90 if provided
  if (data.location_lat !== undefined) {
    if (typeof data.location_lat !== 'number' || data.location_lat < -90 || data.location_lat > 90) {
      throw new Error('Location latitude must be between -90 and 90');
    }
  }
  
  // location_lng must be -180 to 180 if provided
  if (data.location_lng !== undefined) {
    if (typeof data.location_lng !== 'number' || data.location_lng < -180 || data.location_lng > 180) {
      throw new Error('Location longitude must be between -180 and 180');
    }
  }
}
