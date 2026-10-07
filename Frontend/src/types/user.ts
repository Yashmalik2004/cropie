import type { BaseEntity } from './common';

export interface User extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'user';
}

export interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  clearError: () => void;
  clearUsers: () => void;
  clearAllUsersError: () => void;
  clearUsersError: () => void;
  setPagination: (pagination: Partial<UserState['pagination']>) => void;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  result: {
    token: string;
    user: User;
  };
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuestMode: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    phone: string,
    address: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  migrationStatus: {
    isLoading: boolean;
    result: MigrationResult | null;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}
