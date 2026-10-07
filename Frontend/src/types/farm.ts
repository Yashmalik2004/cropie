export interface Farm {
  id: string;
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
  coordinates: number[][]; // Array of [lng, lat] pairs for polygon
  area: number; // in hectares
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FarmFormData {
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
}

export interface RangeMeta {
  min: number;
  max: number;
  unit?: string;
  min_label?: string;
  max_label?: string;
  stops: Array<{
    value: number;
    color: string;
  }>;
}

export interface AgmarknetData {
  success: boolean;
  message: string;
  title: string;
  data: Array<{
    key: string;
    columns: Array<{ key: string; title: string }>;
  }>;
  rows: Array<Record<string, string | number | null>>;
  average?: Record<string, string | number | null>;
}

export interface FarmState {
  farms: Farm[];
  allFarms: Farm[];
  currentFarm: Farm | null;
  loading: boolean;
  error: string | null;
  guestMode: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchFarms: (page?: number, limit?: number) => Promise<void>;
  fetchAllFarms: (page?: number, limit?: number) => Promise<void>;
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => Promise<void>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void;
  setPagination: (pagination: Partial<FarmState['pagination']>) => void;
  setGuestMode: (isGuest: boolean) => void;
  clearAllData: () => void;
}

export interface FarmStore extends FarmState {
  fetchAllFarms: (page?: number, limit?: number) => Promise<void>;
  fetchFarms: (page?: number, limit?: number) => Promise<void>;
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => Promise<void>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void;
  setPagination: (pagination: Partial<FarmState['pagination']>) => void;
  setGuestMode: (isGuest: boolean) => void;
  clearAllData: () => void;
}

export interface HeatmapData {
  date_used?: string; // YYYY-MM-DD - reference date the satellite imagery was sampled at
  location: {
    district: string;
    state?: string | null;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    complete_address: string;
  };
  ndvi_shape: number[];
  sensor_shape: number[];
  masks: {
    red_mask_base64: string;
    yellow_mask_base64: string;
    green_mask_base64: string;
    range_mask_base64?: string;
    range_meta?: RangeMeta;
  };
  'ndwi-masks'?: Partial<{
    brown_mask_base64: string;
    yellow_mask_base64: string;
    light_blue_mask_base64: string;
    range_mask_base64: string;
    range_meta: RangeMeta;
  }>;
  'ndre-masks'?: Partial<{
    purple_mask_base64: string;
    pink_mask_base64: string;
    light_green_mask_base64: string;
    dark_green_mask_base64: string;
    range_mask_base64: string;
    range_meta: RangeMeta;
  }>;
  anomaly?: {
    tile_urls?: {
      anomaly_heatmap?: string;
    };
    ndvi_trend?: {
      date: string;
      mean_ndvi: number;
    }[];
  };
  pixel_counts: {
    valid: number;
    red: number;
    yellow: number;
    green: number;
  };
  thresholds: {
    t1: number;
    t2: number;
  };
  suggestions: {
    overall_assessment: string;
    field_management: string[];
    soil_recommendations: string[];
    immediate_actions: string[];
    seasonal_planning: string[];
    risk_alerts: string[];
  };
  news?: NewsItem[];
  news_ai_analysis?: string;
  rate?: {
    govdata?: MandiDayData[] | null;
    agmarknet?: AgmarknetData;
  };
  mandi_ai_analysis?: string;
  ndwi_pixel_counts?: {
    valid?: number;
    brown?: number;
    yellow?: number;
    light_blue?: number;
  };
  ndre_pixel_counts?: {
    valid?: number;
    purple?: number;
    pink?: number;
    light_green?: number;
    dark_green?: number;
  };
}

export interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MandiDayData {
  date: string;
  records: MandiRecord[];
}

export interface NewsItem {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: string;
}

export interface WeatherData {
  date: string;
  agmarknet?: AgmarknetData;
  precipitation?: number;
  weather_description?: string;
}

export const CROP_OPTIONS = [
  'Wheat',
  'Rice',
  'Corn',
  'Soybeans',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Tomato',
  'Onion',
  'Cabbage',
  'Carrot',
  'Beans',
  'Peas',
  'Sunflower',
  'Barley',
  'Oats',
] as const;

export type CropType = (typeof CROP_OPTIONS)[number];

// Crop calendar with cultivation and harvest months
export const CROP_CALENDAR: Record<string, { cultivation: string[]; harvest: string[] }> = {
  Wheat: {
    cultivation: ['Oct', 'Nov', 'Dec'],
    harvest: ['Mar', 'Apr'],
  },
  Rice: {
    cultivation: ['Jun', 'Jul'],
    harvest: ['Oct', 'Nov'],
  },
  Corn: {
    cultivation: ['Jun', 'Jul'],
    harvest: ['Sep', 'Oct'],
  },
  Soybeans: {
    cultivation: ['Jun', 'Jul'],
    harvest: ['Oct', 'Nov'],
  },
  Cotton: {
    cultivation: ['Apr', 'May', 'Jun'],
    harvest: ['Nov', 'Dec', 'Jan'],
  },
  Sugarcane: {
    cultivation: ['Feb', 'Mar', 'Oct', 'Nov'],
    harvest: ['Nov', 'Dec', 'Jan', 'Feb'],
  },
  Potato: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Jan', 'Feb'],
  },
  Tomato: {
    cultivation: ['Jun', 'Jul', 'Nov', 'Dec'],
    harvest: ['Sep', 'Oct', 'Feb', 'Mar'],
  },
  Onion: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Feb', 'Mar'],
  },
  Cabbage: {
    cultivation: ['Sep', 'Oct'],
    harvest: ['Jan', 'Feb'],
  },
  Carrot: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Jan', 'Feb'],
  },
  Beans: {
    cultivation: ['Jun', 'Jul'],
    harvest: ['Sep', 'Oct'],
  },
  Peas: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Jan', 'Feb'],
  },
  Sunflower: {
    cultivation: ['Jan', 'Feb', 'Jun', 'Jul'],
    harvest: ['Apr', 'May', 'Sep', 'Oct'],
  },
  Barley: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Mar', 'Apr'],
  },
  Oats: {
    cultivation: ['Oct', 'Nov'],
    harvest: ['Mar', 'Apr'],
  },
};

// Helper function to convert month name to number (1-12)
const monthNameToNumber = (monthName: string): number => {
  const months: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  return months[monthName] || 1;
};

// Calculate planting and harvest dates based on crop and current date
export const calculateCropDates = (
  cropName: string,
  referenceDate: Date = new Date()
): { plantingDate: string; harvestDate: string } => {
  const calendar = CROP_CALENDAR[cropName];
  if (!calendar) {
    return { plantingDate: '', harvestDate: '' };
  }

  const currentMonth = referenceDate.getMonth() + 1; // 1-12
  const currentYear = referenceDate.getFullYear();

  // Convert cultivation and harvest months to numbers
  const cultivationMonths = calendar.cultivation.map(monthNameToNumber);
  const harvestMonths = calendar.harvest.map(monthNameToNumber);

  // Find the cultivation month - prioritize past cultivations
  let plantingYear = currentYear;
  const plantingMonth = cultivationMonths[0]!;

  // If earliest cultivation month hasn't occurred yet this year, look back to last year
  if (plantingMonth > currentMonth) {
    plantingYear = currentYear - 1;
  }

  // Find harvest month - use the first one after the cultivation period ends
  const maxCultivationMonth = Math.max(...cultivationMonths);
  let harvestYear = plantingYear;
  const harvestMonth = harvestMonths[0]!;

  // If harvest month is in an earlier month than max cultivation, it's in the next year
  if (harvestMonth <= maxCultivationMonth) {
    harvestYear = plantingYear + 1;
  }

  const plantingDateString = `${plantingYear}-${String(plantingMonth).padStart(2, '0')}-01`;
  const harvestDateString = `${harvestYear}-${String(harvestMonth).padStart(2, '0')}-01`;

  return { plantingDate: plantingDateString, harvestDate: harvestDateString };
};
