// Environment configuration with type safety

interface EnvironmentConfig {
  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;

  // Map Configuration
  MAP_API_KEY: string;
  MAP_DEFAULT_CENTER_LAT: number;
  MAP_DEFAULT_CENTER_LNG: number;
  MAP_DEFAULT_ZOOM: number;

  // Weather API Configuration
  WEATHER_API_KEY: string;
  WEATHER_API_URL: string;

  // Authentication Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_DEBUG_MODE: boolean;
  ENABLE_MOCK_DATA: boolean;

  // Support Configuration
  SUPPORT_EMAIL: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
}

function getBooleanEnvVar(key: string, defaultValue = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getNumberEnvVar(key: string, defaultValue?: number): number {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(
        `Environment variable ${key} is required but not defined`
      );
    }
    return defaultValue;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

export const env: EnvironmentConfig = {
  // App Configuration
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Agriculture Platform'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  ENVIRONMENT: getEnvVar(
    'VITE_ENVIRONMENT',
    'development'
  ) as EnvironmentConfig['ENVIRONMENT'],

  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://CropLab.onrender.com' 
      : 'http://localhost:8000'),
  API_TIMEOUT: getNumberEnvVar('VITE_API_TIMEOUT', 30000),

  // Map Configuration
  MAP_API_KEY: getEnvVar('VITE_MAP_API_KEY', 'demo_api_key'),
  MAP_DEFAULT_CENTER_LAT: getNumberEnvVar(
    'VITE_MAP_DEFAULT_CENTER_LAT',
    40.7128
  ),
  MAP_DEFAULT_CENTER_LNG: getNumberEnvVar(
    'VITE_MAP_DEFAULT_CENTER_LNG',
    -74.006
  ),
  MAP_DEFAULT_ZOOM: getNumberEnvVar('VITE_MAP_DEFAULT_ZOOM', 10),

  // Weather API Configuration
  WEATHER_API_KEY: getEnvVar('VITE_WEATHER_API_KEY', 'demo_weather_key'),
  WEATHER_API_URL: getEnvVar(
    'VITE_WEATHER_API_URL',
    'https://api.openweathermap.org/data/2.5'
  ),

  // Authentication Configuration
  JWT_SECRET: getEnvVar('VITE_JWT_SECRET', 'demo_jwt_secret_for_development'),
  JWT_EXPIRES_IN: getEnvVar('VITE_JWT_EXPIRES_IN', '24h'),

  // Feature Flags
  ENABLE_ANALYTICS: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
  ENABLE_DEBUG_MODE: getBooleanEnvVar('VITE_ENABLE_DEBUG_MODE', true),
  ENABLE_MOCK_DATA: getBooleanEnvVar('VITE_ENABLE_MOCK_DATA', true),

  // Support Configuration
  SUPPORT_EMAIL: getEnvVar(
    'VITE_SUPPORT_EMAIL',
    'support@agriculture-platform.com'
  ),
};

// Validate environment in development
if (env.ENVIRONMENT === 'development' && env.ENABLE_DEBUG_MODE) {
  console.log('🌱 Agriculture Platform Environment Configuration:', {
    environment: env.ENVIRONMENT,
    apiBaseUrl: env.API_BASE_URL,
    enableMockData: env.ENABLE_MOCK_DATA,
    enableDebugMode: env.ENABLE_DEBUG_MODE,
  });
}
