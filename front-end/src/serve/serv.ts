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
import { ApiError, parseError, logError, HTTP_STATUS } from './errors';

// Import all types
import type {
  UUID,
  HttpMethod,
  // Auth
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  MyselfResponse,
  // Profile
  UserProfile,
  ProfileUpdateRequest,
  AvatarUploadResponse,
  // Experiences
  Experience,
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  ExperienceCreateResponse,
  // Interests
  Interest,
  InterestCreateRequest,
  InterestUpdateRequest,
  // Categories
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryCreateResponse,
  CategoryIconResponse,
  // PAPS
  Paps,
  PapsDetail,
  PapsListResponse,
  PapsListParams,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsCreateResponse,
  PapsMediaListResponse,
  MediaUploadResponse,
  // Comments
  Comment,
  CommentsListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentThreadResponse,
  RepliesListResponse,
  // SPAP
  Spap,
  SpapListResponse,
  MyApplicationsResponse,
  SpapCreateRequest,
  SpapCreateResponse,
  SpapStatusUpdateRequest,
  SpapMediaListResponse,
  // Admin
  AdminUser,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUserReplaceRequest,
  // System
  UptimeResponse,
  SystemInfoResponse,
  StatsResponse,
} from './types';

// Import all validators
import { validateRegisterRequest, validateLoginRequest } from './auth';
import { 
  validateProfileUpdateRequest, 
  validateExperienceCreateRequest,
  validateExperienceUpdateRequest,
  validateInterestCreateRequest,
  validateInterestUpdateRequest,
} from './profile';
import { validateCategoryCreateRequest, validateCategoryUpdateRequest } from './categories';
import { validatePapsCreateRequest, validatePapsUpdateRequest, validatePapsListParams } from './paps';
import { validateCommentCreateRequest, validateReplyCreateRequest } from './comments';
import { validateSpapStatusUpdateRequest } from './spap';
import { validateAdminUserCreateRequest } from './system';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Base URL for API requests */
export const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://api.underboss.com';

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 30000;

declare const __DEV__: boolean;

// =============================================================================
// REQUEST TYPE DEFINITIONS - Maps endpoint to its request type
// =============================================================================

/** Request types for each endpoint */
export interface EndpointRequestMap {
  // Auth
  'register': RegisterRequest;
  'login': LoginRequest;
  'whoami': void;
  'myself': void;
  
  // Profile
  'profile.get': void;
  'profile.update': ProfileUpdateRequest;
  'profile.getByUsername': { username: string };
  'profile.updateByUsername': ProfileUpdateRequest & { username: string };
  
  // Avatar
  'avatar.upload': { file: File | Blob };
  'avatar.get': void;
  'avatar.delete': void;
  'avatar.getByUsername': { username: string };
  
  // Experiences
  'experiences.list': void;
  'experiences.create': ExperienceCreateRequest;
  'experiences.update': ExperienceUpdateRequest & { exp_id: UUID };
  'experiences.delete': { exp_id: UUID };
  'experiences.listByUsername': { username: string };
  
  // Interests
  'interests.list': void;
  'interests.create': InterestCreateRequest;
  'interests.update': InterestUpdateRequest & { category_id: UUID };
  'interests.delete': { category_id: UUID };
  'interests.listByUsername': { username: string };
  
  // Categories
  'categories.list': void;
  'categories.get': { category_id: UUID };
  'categories.create': CategoryCreateRequest;
  'categories.update': CategoryUpdateRequest & { category_id: UUID };
  'categories.delete': { category_id: UUID };
  'categories.iconUpload': { category_id: UUID; file: File | Blob };
  'categories.iconGet': { category_id: UUID };
  'categories.iconDelete': { category_id: UUID };
  
  // PAPS
  'paps.list': PapsListParams | void;
  'paps.get': { paps_id: UUID };
  'paps.create': PapsCreateRequest;
  'paps.update': PapsUpdateRequest & { paps_id: UUID };
  'paps.delete': { paps_id: UUID };
  'paps.addCategory': { paps_id: UUID; category_id: UUID };
  'paps.removeCategory': { paps_id: UUID; category_id: UUID };
  
  // PAPS Media
  'paps.media.list': { paps_id: UUID };
  'paps.media.upload': { paps_id: UUID; files: File[] | Blob[] };
  'paps.media.get': { media_id: UUID };
  'paps.media.delete': { media_id: UUID };
  
  // Comments
  'comments.list': { paps_id: UUID };
  'comments.create': CommentCreateRequest & { paps_id: UUID };
  'comments.get': { comment_id: UUID };
  'comments.update': CommentCreateRequest & { comment_id: UUID };
  'comments.delete': { comment_id: UUID };
  'comments.replies': { comment_id: UUID };
  'comments.reply': CommentCreateRequest & { comment_id: UUID };
  'comments.thread': { comment_id: UUID };
  
  // SPAP (Applications)
  'spap.listForPaps': { paps_id: UUID };
  'spap.my': void;
  'spap.apply': SpapCreateRequest & { paps_id: UUID };
  'spap.get': { spap_id: UUID };
  'spap.withdraw': { spap_id: UUID };
  'spap.updateStatus': SpapStatusUpdateRequest & { spap_id: UUID };
  
  // SPAP Media
  'spap.media.list': { spap_id: UUID };
  'spap.media.upload': { spap_id: UUID; files: File[] | Blob[] };
  'spap.media.get': { media_id: UUID };
  'spap.media.delete': { media_id: UUID };
  
  // System
  'system.uptime': void;
  'system.info': void;
  'system.stats': void;
  
  // Admin Users
  'admin.users.list': void;
  'admin.users.create': AdminUserCreateRequest;
  'admin.users.get': { user_id: UUID };
  'admin.users.update': AdminUserUpdateRequest & { user_id: UUID };
  'admin.users.replace': AdminUserReplaceRequest & { user_id: UUID };
  'admin.users.delete': { user_id: UUID };
}

// =============================================================================
// RESPONSE TYPE DEFINITIONS - Maps endpoint to its response type
// =============================================================================

/** Clean user info returned after login (no internal data) */
export interface UserInfo {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

/** Response types for each endpoint */
export interface EndpointResponseMap {
  // Auth - returns clean user-facing data
  'register': { userId: string };
  'login': UserInfo;  // Auto-saves token & returns user info
  'whoami': { username: string };
  'myself': UserInfo;
  
  // Profile
  'profile.get': UserProfile;
  'profile.update': UserProfile;
  'profile.getByUsername': UserProfile;
  'profile.updateByUsername': UserProfile;
  
  // Avatar
  'avatar.upload': AvatarUploadResponse;
  'avatar.get': Blob;
  'avatar.delete': void;
  'avatar.getByUsername': Blob;
  
  // Experiences
  'experiences.list': Experience[];
  'experiences.create': ExperienceCreateResponse;
  'experiences.update': Experience;
  'experiences.delete': void;
  'experiences.listByUsername': Experience[];
  
  // Interests
  'interests.list': Interest[];
  'interests.create': void;
  'interests.update': Interest;
  'interests.delete': void;
  'interests.listByUsername': Interest[];
  
  // Categories
  'categories.list': Category[];
  'categories.get': Category;
  'categories.create': CategoryCreateResponse;
  'categories.update': Category;
  'categories.delete': void;
  'categories.iconUpload': CategoryIconResponse;
  'categories.iconGet': Blob;
  'categories.iconDelete': void;
  
  // PAPS
  'paps.list': PapsListResponse;
  'paps.get': PapsDetail;
  'paps.create': PapsCreateResponse;
  'paps.update': Paps;
  'paps.delete': void;
  'paps.addCategory': void;
  'paps.removeCategory': void;
  
  // PAPS Media
  'paps.media.list': PapsMediaListResponse;
  'paps.media.upload': MediaUploadResponse;
  'paps.media.get': Blob;
  'paps.media.delete': void;
  
  // Comments
  'comments.list': CommentsListResponse;
  'comments.create': CommentCreateResponse;
  'comments.get': Comment;
  'comments.update': Comment;
  'comments.delete': void;
  'comments.replies': RepliesListResponse;
  'comments.reply': CommentCreateResponse;
  'comments.thread': CommentThreadResponse;
  
  // SPAP (Applications)
  'spap.listForPaps': SpapListResponse;
  'spap.my': MyApplicationsResponse;
  'spap.apply': SpapCreateResponse;
  'spap.get': Spap;
  'spap.withdraw': void;
  'spap.updateStatus': Spap;
  
  // SPAP Media
  'spap.media.list': SpapMediaListResponse;
  'spap.media.upload': MediaUploadResponse;
  'spap.media.get': Blob;
  'spap.media.delete': void;
  
  // System
  'system.uptime': UptimeResponse;
  'system.info': SystemInfoResponse;
  'system.stats': StatsResponse;
  
  // Admin Users
  'admin.users.list': AdminUser[];
  'admin.users.create': { user_id: UUID };
  'admin.users.get': AdminUser;
  'admin.users.update': AdminUser;
  'admin.users.replace': AdminUser;
  'admin.users.delete': void;
}

// =============================================================================
// ENDPOINT TYPE
// =============================================================================

/** All valid endpoint keys */
export type Endpoint = keyof EndpointRequestMap;

// =============================================================================
// INTERNAL ENDPOINT CONFIGURATION
// =============================================================================

type EndpointConfig = {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
  multiFile?: boolean;
};

const ENDPOINTS: Record<Endpoint, EndpointConfig> = {
  // ===== AUTH =====
  'register': { method: 'POST', path: '/register', auth: false, validate: validateRegisterRequest },
  'login': { method: 'POST', path: '/login', auth: false, validate: validateLoginRequest },
  'whoami': { method: 'GET', path: '/who-am-i', auth: true },
  'myself': { method: 'GET', path: '/myself', auth: true },

  // ===== PROFILE =====
  'profile.get': { method: 'GET', path: '/profile', auth: true },
  'profile.update': { method: 'PUT', path: '/profile', auth: true, validate: validateProfileUpdateRequest },
  'profile.getByUsername': { method: 'GET', path: '/user/{username}/profile', auth: true },
  'profile.updateByUsername': { method: 'PATCH', path: '/user/{username}/profile', auth: true, validate: validateProfileUpdateRequest },

  // ===== AVATAR =====
  'avatar.upload': { method: 'POST', path: '/profile/avatar', auth: true, isFileUpload: true, fileField: 'image' },
  'avatar.get': { method: 'GET', path: '/profile/avatar', auth: true },
  'avatar.delete': { method: 'DELETE', path: '/profile/avatar', auth: true },
  'avatar.getByUsername': { method: 'GET', path: '/user/{username}/profile/avatar', auth: true },

  // ===== EXPERIENCES =====
  'experiences.list': { method: 'GET', path: '/profile/experiences', auth: true },
  'experiences.create': { method: 'POST', path: '/profile/experiences', auth: true, validate: validateExperienceCreateRequest },
  'experiences.update': { method: 'PATCH', path: '/profile/experiences/{exp_id}', auth: true, validate: validateExperienceUpdateRequest },
  'experiences.delete': { method: 'DELETE', path: '/profile/experiences/{exp_id}', auth: true },
  'experiences.listByUsername': { method: 'GET', path: '/user/{username}/profile/experiences', auth: true },

  // ===== INTERESTS =====
  'interests.list': { method: 'GET', path: '/profile/interests', auth: true },
  'interests.create': { method: 'POST', path: '/profile/interests', auth: true, validate: validateInterestCreateRequest },
  'interests.update': { method: 'PATCH', path: '/profile/interests/{category_id}', auth: true, validate: validateInterestUpdateRequest },
  'interests.delete': { method: 'DELETE', path: '/profile/interests/{category_id}', auth: true },
  'interests.listByUsername': { method: 'GET', path: '/user/{username}/profile/interests', auth: true },

  // ===== CATEGORIES =====
  'categories.list': { method: 'GET', path: '/categories', auth: true },
  'categories.get': { method: 'GET', path: '/categories/{category_id}', auth: true },
  'categories.create': { method: 'POST', path: '/categories', auth: true, validate: validateCategoryCreateRequest },
  'categories.update': { method: 'PATCH', path: '/categories/{category_id}', auth: true, validate: validateCategoryUpdateRequest },
  'categories.delete': { method: 'DELETE', path: '/categories/{category_id}', auth: true },
  'categories.iconUpload': { method: 'POST', path: '/categories/{category_id}/icon', auth: true, isFileUpload: true, fileField: 'image' },
  'categories.iconGet': { method: 'GET', path: '/categories/{category_id}/icon', auth: true },
  'categories.iconDelete': { method: 'DELETE', path: '/categories/{category_id}/icon', auth: true },

  // ===== PAPS =====
  'paps.list': { method: 'GET', path: '/paps', auth: true, validate: validatePapsListParams },
  'paps.get': { method: 'GET', path: '/paps/{paps_id}', auth: true },
  'paps.create': { method: 'POST', path: '/paps', auth: true, validate: validatePapsCreateRequest },
  'paps.update': { method: 'PUT', path: '/paps/{paps_id}', auth: true, validate: validatePapsUpdateRequest },
  'paps.delete': { method: 'DELETE', path: '/paps/{paps_id}', auth: true },
  'paps.addCategory': { method: 'POST', path: '/paps/{paps_id}/categories/{category_id}', auth: true },
  'paps.removeCategory': { method: 'DELETE', path: '/paps/{paps_id}/categories/{category_id}', auth: true },

  // ===== PAPS MEDIA =====
  'paps.media.list': { method: 'GET', path: '/paps/{paps_id}/media', auth: true },
  'paps.media.upload': { method: 'POST', path: '/paps/{paps_id}/media', auth: true, isFileUpload: true, fileField: 'media', multiFile: true },
  'paps.media.get': { method: 'GET', path: '/paps/media/{media_id}', auth: true },
  'paps.media.delete': { method: 'DELETE', path: '/paps/media/{media_id}', auth: true },

  // ===== COMMENTS =====
  'comments.list': { method: 'GET', path: '/paps/{paps_id}/comments', auth: true },
  'comments.create': { method: 'POST', path: '/paps/{paps_id}/comments', auth: true, validate: validateCommentCreateRequest },
  'comments.get': { method: 'GET', path: '/comments/{comment_id}', auth: true },
  'comments.update': { method: 'PUT', path: '/comments/{comment_id}', auth: true, validate: validateCommentCreateRequest },
  'comments.delete': { method: 'DELETE', path: '/comments/{comment_id}', auth: true },
  'comments.replies': { method: 'GET', path: '/comments/{comment_id}/replies', auth: true },
  'comments.reply': { method: 'POST', path: '/comments/{comment_id}/replies', auth: true, validate: validateReplyCreateRequest },
  'comments.thread': { method: 'GET', path: '/comments/{comment_id}/thread', auth: true },

  // ===== SPAP (Applications) =====
  'spap.listForPaps': { method: 'GET', path: '/paps/{paps_id}/applications', auth: true },
  'spap.my': { method: 'GET', path: '/spap/my', auth: true },
  'spap.apply': { method: 'POST', path: '/paps/{paps_id}/apply', auth: true },
  'spap.get': { method: 'GET', path: '/spap/{spap_id}', auth: true },
  'spap.withdraw': { method: 'DELETE', path: '/spap/{spap_id}', auth: true },
  'spap.updateStatus': { method: 'PUT', path: '/spap/{spap_id}/status', auth: true, validate: validateSpapStatusUpdateRequest },

  // ===== SPAP MEDIA =====
  'spap.media.list': { method: 'GET', path: '/spap/{spap_id}/media', auth: true },
  'spap.media.upload': { method: 'POST', path: '/spap/{spap_id}/media', auth: true, isFileUpload: true, fileField: 'media', multiFile: true },
  'spap.media.get': { method: 'GET', path: '/spap/media/{media_id}', auth: true },
  'spap.media.delete': { method: 'DELETE', path: '/spap/media/{media_id}', auth: true },

  // ===== SYSTEM =====
  'system.uptime': { method: 'GET', path: '/uptime', auth: false },
  'system.info': { method: 'GET', path: '/info', auth: true },
  'system.stats': { method: 'GET', path: '/stats', auth: true },

  // ===== ADMIN USERS =====
  'admin.users.list': { method: 'GET', path: '/users', auth: true },
  'admin.users.create': { method: 'POST', path: '/users', auth: true, validate: validateAdminUserCreateRequest },
  'admin.users.get': { method: 'GET', path: '/users/{user_id}', auth: true },
  'admin.users.update': { method: 'PATCH', path: '/users/{user_id}', auth: true },
  'admin.users.replace': { method: 'PUT', path: '/users/{user_id}', auth: true },
  'admin.users.delete': { method: 'DELETE', path: '/users/{user_id}', auth: true },
};

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

// =============================================================================
// MAIN SERV FUNCTION
// =============================================================================

/**
 * The main service function - single entry point for all API calls.
 * 
 * @typeParam E - The endpoint key (autocompleted)
 * @param endpoint - The endpoint to call (e.g., "register", "paps.list")
 * @param data - The request data (typed based on endpoint)
 * @returns Promise with the typed response
 * 
 * @example
 * // Register - TypeScript knows the request shape
 * const { user_id } = await serv("register", { 
 *   username: "john",      // required
 *   email: "j@x.com",      // required
 *   password: "secret123", // required
 *   phone: "+1234567890"   // optional
 * });
 * 
 * @example
 * // Login
 * const { token } = await serv("login", { 
 *   login: "john",       // username, email, or phone
 *   password: "secret123" 
 * });
 * 
 * @example
 * // Get PAPS list with filters
 * const { paps, total_count } = await serv("paps.list", { 
 *   status: "published", 
 *   max_distance: 25 
 * });
 * 
 * @example
 * // Get specific PAPS by ID
 * const papsDetail = await serv("paps.get", { paps_id: "uuid-here" });
 * 
 * @example
 * // Create a comment (content is required, paps_id goes to URL)
 * const { comment_id } = await serv("comments.create", { 
 *   paps_id: "uuid-here", 
 *   content: "Great job posting!" 
 * });
 * 
 * @example
 * // Upload avatar
 * await serv("avatar.upload", { file: imageFile });
 */
export async function serv<E extends Endpoint>(
  endpoint: E,
  ...args: EndpointRequestMap[E] extends void 
    ? [] 
    : [data: EndpointRequestMap[E]]
): Promise<EndpointResponseMap[E]> {
  const data = args[0] as Record<string, any> | undefined;
  const config = ENDPOINTS[endpoint];

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
    if (endpoint.includes('.get') && (endpoint.includes('avatar') || endpoint.includes('icon') || endpoint.includes('media'))) {
      reqConfig.responseType = 'blob';
    }

    // Execute request
    const response: AxiosResponse = await api.request(reqConfig);

    // Handle 204 No Content
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as EndpointResponseMap[E];
    }

    // Post-process responses for certain endpoints
    const result = await postProcessResponse(endpoint, response.data, data);
    return result as EndpointResponseMap[E];
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
 * 3. Return clean user-facing data (no internal info)
 */
async function postProcessResponse(
  endpoint: Endpoint,
  responseData: any,
  requestData?: Record<string, any>
): Promise<any> {
  switch (endpoint) {
    case 'register': {
      // Return clean response
      return { userId: responseData.user_id };
    }

    case 'login': {
      // Save token to AppSettings
      const { token } = responseData as LoginResponse;
      AppSettings.token = token;

      // Fetch user info and cache it
      try {
        const myselfResponse = await api.get('/myself', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const myself = myselfResponse.data as MyselfResponse;
        
        // Save to AppSettings
        AppSettings.userId = myself.aid;
        AppSettings.username = myself.login;
        
        // Return clean user info (no password hash!)
        return {
          userId: myself.aid,
          username: myself.login,
          email: myself.email,
          isAdmin: myself.isadmin,
        } as UserInfo;
      } catch (e) {
        // If /myself fails, return basic info from login
        return {
          userId: '',
          username: requestData?.login || '',
          email: '',
          isAdmin: false,
        } as UserInfo;
      }
    }

    case 'whoami': {
      // Clean response
      return { username: responseData.login };
    }

    case 'myself': {
      const myself = responseData as MyselfResponse;
      // Update AppSettings cache
      AppSettings.userId = myself.aid;
      AppSettings.username = myself.login;
      
      // Return clean user info (NO password hash!)
      return {
        userId: myself.aid,
        username: myself.login,
        email: myself.email,
        isAdmin: myself.isadmin,
      } as UserInfo;
    }

    case 'profile.get':
    case 'profile.update': {
      // Cache profile in AppSettings
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

/** Set auth token and save it */
export const setAuthToken = (token: string) => { AppSettings.token = token; };

/** Clear auth session */
export const clearAuth = () => AppSettings.clearSession();

/** Get all available endpoint keys */
export const getEndpoints = () => Object.keys(ENDPOINTS) as Endpoint[];

/** Get current user info from cache */
export const getCurrentUser = (): UserInfo | null => {
  if (!AppSettings.isAuthenticated()) return null;
  return {
    userId: AppSettings.userId,
    username: AppSettings.username,
    email: '', // Not cached, call serv("myself") if needed
    isAdmin: false, // Not cached, call serv("myself") if needed
  };
};

/** Get cached user profile */
export const getCachedProfile = () => AppSettings.userProfile;
