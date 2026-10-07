import { post, get, withAuth } from '../utils/api';
import type {
  RequestConfig,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/types';

/**
 * Authentication API Service
 */
export class AuthAPI {
  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await post<AuthResponse>('/user/login', credentials);

      // Store token in localStorage for subsequent requests
      if (response.result?.token) {
        localStorage.setItem('auth_token', response.result.token);
        localStorage.setItem('auth_user', JSON.stringify(response.result.user));
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await post<AuthResponse>('/user/register', userData);

      // Store token in localStorage for subsequent requests
      if (response.result?.token) {
        localStorage.setItem('auth_token', response.result.token);
        localStorage.setItem('auth_user', JSON.stringify(response.result.user));
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');

      if (token) {
        // Call backend logout endpoint
        await get('/user/logout', withAuth(token));
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get current token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verify token with backend (optional - for token validation)
   */
  static async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      await get('/user/protected', withAuth(token));
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      this.logout();
      return false;
    }
  }

  /**
   * Get auth headers for API requests
   */
  static getAuthConfig(): RequestConfig {
    const token = this.getToken();
    return token ? withAuth(token) : {};
  }
}

export default AuthAPI;
