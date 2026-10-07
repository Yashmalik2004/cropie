// API related types

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | undefined;
  statusCode?: number;
}

export interface BackendApiResponse<T = unknown> {
  code: number;
  message: string;
  result?: T;
  data?: T;
}

export interface ApiUserData {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt?: string;
}

export interface ApiCoordinates {
  type: string;
  coordinates: number[][][];
}

export interface ApiFarmData {
  _id?: string;
  id: string;
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
  coordinates: ApiCoordinates | number[][];
  area: number;
  createdAt: string;
  updatedAt: string;
  userId: string | { _id: string };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AppError {
  type: 'api' | 'validation' | 'network' | 'auth' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    forgotPassword: string;
    resetPassword: string;
  };
  farms: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
  alerts: {
    list: string;
    markAsRead: (id: string) => string;
    dismiss: (id: string) => string;
  };
}
