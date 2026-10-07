import { env } from '../config/env';
import type { ApiError, AppError, RequestConfig } from '../types/api';

/**
 * Default request configuration
 */
const DEFAULT_CONFIG: RequestConfig = {
  timeout: env.API_TIMEOUT,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Create an API error from response
 */
function createApiError(response: Response, data?: unknown): ApiError {
  const errorData = data as Record<string, unknown> | undefined;

  return {
    code: (errorData?.code as string) || 'API_ERROR',
    message:
      (errorData?.message as string) ||
      response.statusText ||
      'An error occurred',
    statusCode: response.status,
    details: (errorData?.details as Record<string, unknown>) ?? {},
  };
}

/**
 * Create an app error from various error types
 */
export function createAppError(
  type: AppError['type'],
  message: string,
  details?: Record<string, unknown>
): AppError {
  const error: AppError = {
    type,
    message,
    details: details ?? {},
  };
  return error;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request with retry logic
 */
async function makeRequest(
  url: string,
  options: RequestInit,
  config: RequestConfig
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt <= (config.retries || 0); attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...config.headers,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < (config.retries || 0)) {
        await sleep((config.retryDelay || 1000) * Math.pow(2, attempt));
      }
    }
  }

  throw lastError!;
}

/**
 * Generic API request function
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: Partial<RequestConfig> = {}
): Promise<T> {
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...config.headers,
    },
  };
  const url = `${env.API_BASE_URL}${endpoint}`;

  try {
    const response = await makeRequest(url, options, fullConfig);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON
      }

      const apiError = createApiError(response, errorData);
      throw createAppError('api', apiError.message, {
        code: apiError.code,
        statusCode: apiError.statusCode,
        details: apiError.details,
      });
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw createAppError('network', 'Network error occurred', {
        originalError: error,
      });
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw createAppError('network', 'Request timeout', {
        originalError: error,
      });
    }

    // Re-throw AppError instances
    if ((error as AppError).type) {
      throw error;
    }

    throw createAppError('unknown', 'An unexpected error occurred', {
      originalError: error,
    });
  }
}

/**
 * GET request
 */
export function get<T>(
  endpoint: string,
  config?: Partial<RequestConfig>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, config);
}

/**
 * POST request
 */
export function post<T>(
  endpoint: string,
  data?: unknown,
  config?: Partial<RequestConfig>
): Promise<T> {
  const requestInit: RequestInit = {
    method: 'POST',
  };

  if (data) {
    requestInit.body = JSON.stringify(data);
  }

  return apiRequest<T>(endpoint, requestInit, config);
}

/**
 * PUT request
 */
export function put<T>(
  endpoint: string,
  data?: unknown,
  config?: Partial<RequestConfig>
): Promise<T> {
  const requestInit: RequestInit = {
    method: 'PUT',
  };

  if (data) {
    requestInit.body = JSON.stringify(data);
  }

  return apiRequest<T>(endpoint, requestInit, config);
}

/**
 * PATCH request
 */
export function patch<T>(
  endpoint: string,
  data?: unknown,
  config?: Partial<RequestConfig>
): Promise<T> {
  const requestInit: RequestInit = {
    method: 'PATCH',
  };

  if (data) {
    requestInit.body = JSON.stringify(data);
  }

  return apiRequest<T>(endpoint, requestInit, config);
}

/**
 * DELETE request
 */
export function del<T>(
  endpoint: string,
  config?: Partial<RequestConfig>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' }, config);
}

/**
 * Add authorization header to request config
 */
export function withAuth(
  token: string,
  config: Partial<RequestConfig> = {}
): RequestConfig {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
