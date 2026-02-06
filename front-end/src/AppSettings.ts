import {UserProfile} from './serve'


/**
 * Global application settings and state storage.
 * This class holds static properties accessible throughout the application.
 */
export default class AppSettings {
  /**
   * User authentication token (JWT).
   */
  static token: string = '';

  /**
   * Current user's username.
   */
  static username: string = '';

  /**
   * Current user's UUID.
   */
  static userId: string = '';

  /**
   * Flag indicating if user has completed their profile setup.
   */
  static isProfileComplete: boolean = false;

  /**
   * Cached user profile data.
   */
  static userProfile: UserProfile | null = null;

  /**
   * Theme preference. True for dark mode, false for light mode.
   */
  static darkTheme: boolean = false;

  /**
   * Screen orientation preference.
   * If false, the app should enforce vertical (portrait) view.
   */
  static autoRotate: boolean = false;

  /**
   * Notification preference.
   */
  static notifications: boolean = true;

  /**
   * Clear all session data (used on logout).
   */
  static clearSession(): void {
    this.token = '';
    this.username = '';
    this.userId = '';
    this.isProfileComplete = false;
    this.userProfile = null;
  }

  /**
   * Get authorization header for API calls.
   */
  static getAuthHeader(): { Authorization: string } {
    return {
      Authorization: `Bearer ${this.token}`
    };
  }

  /**
   * Check if user is authenticated.
   */
  static isAuthenticated(): boolean {
    return this.token !== '';
  }
}