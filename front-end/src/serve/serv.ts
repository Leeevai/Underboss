/**
 * serv.ts - The Single Point of Communication with the Backend
 * 
 * This module provides the `serv` function which handles ALL API calls.
 * Every request to the backend should go through this function.
 * 
 * @module serve/serv
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AppSettings from '../AppSettings';
import { ApiError, parseError, logError, HTTP_STATUS } from './common/errors';
import type { HttpMethod } from './common/types';

// Import endpoint configs from all modules
import { authEndpoints } from './auth/endpoints';
import { profileEndpoints } from './profile/endpoints';
import { categoryEndpoints } from './categories/endpoints';
import { papsEndpoints } from './paps/endpoints';
import { spapEndpoints } from './spap/endpoints';
import { asapEndpoints } from './asap/endpoints';
import { paymentEndpoints } from './payments/endpoints';
import { ratingEndpoints } from './ratings/endpoints';
import { commentEndpoints } from './comments/endpoints';
import { chatEndpoints } from './chat/endpoints';
import { systemEndpoints } from './system/endpoints';

// Import types for post-processing
import type { LoginResponse, MyselfRawResponse, UserInfo } from './auth/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

declare const __DEV__: boolean;

/** Base URL for API requests */
export const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://api.underboss.com';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 30000;

// =============================================================================
// ENDPOINT CONFIGURATION
// =============================================================================

interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
  multiFile?: boolean;
}

// Merge all endpoint configs
const ENDPOINTS: Record<string, EndpointConfig> = {
  ...authEndpoints,
  ...profileEndpoints,
  ...categoryEndpoints,
  ...papsEndpoints,
  ...spapEndpoints,
  ...asapEndpoints,
  ...paymentEndpoints,
  ...ratingEndpoints,
  ...commentEndpoints,
  ...chatEndpoints,
  ...systemEndpoints,
};

/** All valid endpoint keys */
export type Endpoint = keyof typeof ENDPOINTS;

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Debug logging in dev mode
api.interceptors.request.use((config) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Build URL by replacing {param} placeholders */
function buildUrl(path: string, data?: Record<string, any>): { url: string; remaining: Record<string, any> } {
  if (!data) return { url: path, remaining: {} };

  let url = path;
  const remaining = { ...data };

  const matches = path.match(/\{(\w+)\}/g);
  if (matches) {
    for (const match of matches) {
      const key = match.slice(1, -1);
      if (remaining[key] !== undefined) {
        url = url.replace(match, encodeURIComponent(String(remaining[key])));
        delete remaining[key];
      }
    }
  }

  return { url, remaining };
}

/** Build query string from object */
function toQueryString(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

/**
 * Build media URL for public access to media files
 * Use this to construct URLs for avatars, category icons, paps media, etc.
 * 
 * @param path - The media path returned from backend (e.g., "media/user/profile/uuid.ext")
 * @returns Full URL to access the media file
 * 
 * @example
 * // Avatar from profile
 * const profile = await serv('profile.get');
 * const avatarUrl = getMediaUrl(profile.avatar_url); // http://localhost:5000/media/user/profile/uuid.jpg
 * 
 * @example  
 * // Category icon
 * const category = await serv('categories.get', { category_id: 'uuid' });
 * const iconUrl = getMediaUrl(category.icon_url); // http://localhost:5000/media/category/uuid.png
 */
export function getMediaUrl(mediaPath: string | null | undefined): string | null {
  if (!mediaPath) return null;
  
  // If already a full URL, return as-is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  // Remove leading slash if present
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.slice(1) : mediaPath;
  
  // Construct full URL
  return `${API_BASE_URL}/${cleanPath}`;
}

/** Get auth headers */
function getAuthHeaders(): Record<string, string> {
  return AppSettings.token ? { Authorization: `Bearer ${AppSettings.token}` } : {};
}

/** Create FormData for file uploads */
function createFormData(fieldName: string, files: File | Blob | File[] | Blob[], body?: Record<string, any>): FormData {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(f => formData.append(fieldName, f));
  } else {
    formData.append(fieldName, files);
  }

  if (body) {
    Object.entries(body).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
  }

  return formData;
}

/** Check if endpoint returns a blob (for file downloads) */
function isBlobEndpoint(endpoint: string): boolean {
  return (
    endpoint.includes('avatar.get') ||
    endpoint.includes('icon') && endpoint.includes('Get') ||
    (endpoint.includes('media') && !endpoint.includes('list') && !endpoint.includes('upload') && !endpoint.includes('delete'))
  );
}

// =============================================================================
// MAIN SERV FUNCTION
// =============================================================================

/**
 * The main service function - single entry point for all API calls.
 * 
 * @param endpoint - The endpoint to call (e.g., "register", "paps.list")
 * @param data - The request data (optional)
 * @returns Promise with the response data
 * 
 * @example
 * // Register
 * const { user_id } = await serv("register", { 
 *   username: "john", email: "j@x.com", password: "secret123" 
 * });
 * 
 * @example
 * // Login (auto-saves token)
 * const userInfo = await serv("login", { login: "john", password: "secret123" });
 * 
 * @example
 * // Get PAPS list
 * const { paps, total } = await serv("paps.list", { status: "published" });
 */
export async function serv<T = any>(endpoint: string, data?: Record<string, any>): Promise<T> {
  const config = ENDPOINTS[endpoint];
  
  if (!config) {
    throw new ApiError(`Unknown endpoint: ${endpoint}`, 0, 'unknown', endpoint);
  }

  const { method, path, auth, validate, isFileUpload, fileField } = config;

  try {
    // Check auth requirement
    if (auth && !AppSettings.isAuthenticated()) {
      throw new ApiError('Authentication required', HTTP_STATUS.UNAUTHORIZED, 'authentication', endpoint);
    }

    // Extract file(s) from data
    const file = data?.file as File | Blob | undefined;
    const files = data?.files as File[] | Blob[] | undefined;
    const bodyData = data ? { ...data } : undefined;
    if (bodyData) {
      delete bodyData.file;
      delete bodyData.files;
    }

    // Build URL with path params
    const { url, remaining } = buildUrl(path, bodyData);

    // Validate data
    if (validate && remaining && Object.keys(remaining).length > 0) {
      validate(remaining);
    }

    // Build request config
    const reqConfig: AxiosRequestConfig = {
      method,
      url,
      headers: auth ? getAuthHeaders() : {},
    };

    // Handle file uploads
    if (isFileUpload && (file || files)) {
      const uploadFiles = files ?? file;
      if (uploadFiles) {
        reqConfig.data = createFormData(fileField ?? 'file', uploadFiles, remaining);
        reqConfig.headers = { ...reqConfig.headers, 'Content-Type': 'multipart/form-data' };
      }
    } 
    // Handle body for POST/PUT/PATCH
    else if (['POST', 'PUT', 'PATCH'].includes(method) && remaining && Object.keys(remaining).length > 0) {
      reqConfig.data = remaining;
    }
    // Handle query params for GET/DELETE
    else if (['GET', 'DELETE'].includes(method) && remaining && Object.keys(remaining).length > 0) {
      reqConfig.url = url + toQueryString(remaining);
    }

    // Check if response should be blob (for file downloads)
    if (isBlobEndpoint(endpoint)) {
      reqConfig.responseType = 'blob';
    }

    // Execute request
    const response: AxiosResponse = await api.request(reqConfig);

    // Handle 204 No Content
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as T;
    }

    // Post-process responses for certain endpoints
    const result = await postProcessResponse(endpoint, response.data, data);
    return result as T;
  } catch (error) {
    const apiError = parseError(error, endpoint);
    logError(apiError);
    throw apiError;
  }
}

// =============================================================================
// POST-PROCESS RESPONSES
// =============================================================================

/**
 * Post-process API responses to:
 * 1. Auto-save auth token after login
 * 2. Auto-fetch and cache user info
 * 3. Return clean user-facing data
 */
async function postProcessResponse(
  endpoint: string,
  responseData: any,
  requestData?: Record<string, any>
): Promise<any> {
  switch (endpoint) {
    case 'register': {
      return { userId: responseData.user_id };
    }

    case 'login': {
      const { token } = responseData as LoginResponse;
      AppSettings.token = token;

      try {
        const myselfResponse = await api.get('/myself', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const myself = myselfResponse.data as MyselfRawResponse;
        
        AppSettings.userId = myself.aid;
        AppSettings.username = myself.login;
        
        return {
          userId: myself.aid,
          username: myself.login,
          email: myself.email,
          isAdmin: myself.isadmin,
        } as UserInfo;
      } catch {
        return {
          userId: '',
          username: requestData?.login || '',
          email: '',
          isAdmin: false,
        } as UserInfo;
      }
    }

    case 'whoami': {
      return { username: responseData.user || responseData.login };
    }

    case 'myself': {
      const myself = responseData as MyselfRawResponse;
      AppSettings.userId = myself.aid;
      AppSettings.username = myself.login;
      
      return {
        userId: myself.aid,
        username: myself.login,
        email: myself.email,
        isAdmin: myself.isadmin,
      } as UserInfo;
    }

    case 'profile.get':
    case 'profile.update':
    case 'profile.patch': {
      AppSettings.userProfile = responseData;
      AppSettings.isProfileComplete = Boolean(
        responseData.first_name && 
        responseData.last_name
      );
      return responseData;
    }

    default:
      return responseData;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export { api as axiosInstance };

/** Check if authenticated */
export const isAuthenticated = () => AppSettings.isAuthenticated();

/** Set auth token */
export const setAuthToken = (token: string) => { AppSettings.token = token; };

/** Clear auth session */
export const clearAuth = () => AppSettings.clearSession();

/** Get all available endpoint keys */
export const getEndpoints = () => Object.keys(ENDPOINTS);

/** Get current user info from cache */
export const getCurrentUser = (): UserInfo | null => {
  if (!AppSettings.isAuthenticated()) return null;
  return {
    userId: AppSettings.userId,
    username: AppSettings.username,
    email: '',
    isAdmin: false,
  };
};

/** Get cached user profile */
export const getCachedProfile = () => AppSettings.userProfile;
