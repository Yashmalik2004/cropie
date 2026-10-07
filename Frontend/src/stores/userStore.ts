import { create } from 'zustand';
import { UserAPI, type User, type UserStats } from '../services/userApi';

interface UserStore {
  // State
  users: User[];
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  clearError: () => void;
  setPagination: (pagination: Partial<UserStore['pagination']>) => void;
}

export const useUserStore = create<UserStore>(set => ({
  // Initial state
  users: [],
  userStats: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  // Fetch all users (admin only)
  fetchUsers: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await UserAPI.getAllUsers(page, limit);

      if (response.code === 1) {
        set({
          users: response.result.users,
          pagination: response.result.pagination,
          loading: false,
        });
      } else {
        set({
          error: response.message || 'Failed to fetch users',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      set({
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Failed to fetch users',
        loading: false,
      });
    }
  },

  // Fetch user statistics (admin only)
  fetchUserStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await UserAPI.getUserStats();

      if (response.code === 1) {
        set({
          userStats: response.result,
          loading: false,
        });
      } else {
        set({
          error: response.message || 'Failed to fetch user statistics',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching user statistics:', error);
      set({
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Failed to fetch user statistics',
        loading: false,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Set pagination
  setPagination: pagination => {
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },
}));
