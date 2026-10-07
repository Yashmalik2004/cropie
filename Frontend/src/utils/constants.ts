// Application constants

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Agriculture Platform',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  supportEmail:
    import.meta.env.VITE_SUPPORT_EMAIL || 'support@agriculture-platform.com',
} as const;

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
} as const;

export const MAP_CONFIG = {
  apiKey: import.meta.env.VITE_MAP_API_KEY || 'demo_api_key',
  defaultCenter: {
    lat: Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT) || 40.7128,
    lng: Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LNG) || -74.006,
  },
  defaultZoom: Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10,
} as const;

export const FEATURE_FLAGS = {
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
} as const;

export const CROP_TYPES = [
  { value: 'corn', label: 'Corn' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'soybeans', label: 'Soybeans' },
  { value: 'rice', label: 'Rice' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'tomatoes', label: 'Tomatoes' },
  { value: 'potatoes', label: 'Potatoes' },
  { value: 'lettuce', label: 'Lettuce' },
  { value: 'carrots', label: 'Carrots' },
  { value: 'onions', label: 'Onions' },
  { value: 'other', label: 'Other' },
] as const;

export const ALERT_TYPES = [
  'pest-risk',
  'irrigation',
  'disease',
  'weather',
  'harvest',
  'planting',
] as const;

export const ALERT_SEVERITIES = ['critical', 'warning', 'info'] as const;

export const MONITORING_FREQUENCIES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;

export const MAP_LAYERS = [
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'streets', label: 'Streets' },
  { value: 'terrain', label: 'Terrain' },
] as const;

export const HEALTH_OVERLAY_TYPES = [
  { value: 'ndvi', label: 'NDVI (Vegetation Health)' },
  { value: 'stress', label: 'Stress Indicators' },
  { value: 'pest-risk', label: 'Pest Risk Zones' },
  { value: 'irrigation', label: 'Irrigation Needs' },
] as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  FARM_CREATE: '/farms/create',
  FARM_DETAIL: '/farms/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;
