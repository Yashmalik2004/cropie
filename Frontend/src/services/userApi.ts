import { get, withAuth } from '../utils/api';
import type { ApiResponse } from '../types/common';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  totalFarmers: number;
  totalAdmins: number;
}

export interface UsersResponse extends ApiResponse<{
  code: number;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  code: number;
  result: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UserStatsResponse extends ApiResponse<UserStats> {
  result: UserStats;
  code:number;
}

/**
 * User API Service
 */
export class UserAPI {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(page = 1, limit = 10): Promise<UsersResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const response = await get<UsersResponse>(
        `/user/all?page=${page}&limit=${limit}`,
        withAuth(token)
      );
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (admin only)
   */
  static async getUserStats(): Promise<UserStatsResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const response = await get<UserStatsResponse>('/user/stats', withAuth(token));
      return response;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
}