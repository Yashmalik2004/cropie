import type { HeatmapData } from '../types/farm';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  profile: {
    phone: string;
    address: string;
  };
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  size: number;
  cropTypes: string[];
  createdAt: string;
}

export interface Crop {
  id: string;
  farmId: string;
  name: string;
  type: string;
  plantedDate: string;
  expectedHarvest: string;
  area: number;
  status: 'planted' | 'growing' | 'harvested';
  notes: string;
}

export interface HeatmapCacheEntry {
  farmId: string;
  data: HeatmapData;
  cachedAt: string;
}

// Storage keys for localStorage
const USERS_KEY = 'agriculture_users';
const FARMS_KEY = 'agriculture_farms';
const CROPS_KEY = 'agriculture_crops';
const HEATMAP_CACHE_KEY = 'agriculture_heatmap_cache';

// Utility functions for localStorage operations
function readFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

function writeToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    throw error;
  }
}

// Initialize with some default data if storage is empty
function initializeStorage() {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@farm.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        profile: {
          phone: '+1234567890',
          address: '123 Farm Street, Agriculture City'
        }
      },
      {
        id: '2',
        email: 'farmer@farm.com',
        password: 'farmer123',
        name: 'John Farmer',
        role: 'user',
        createdAt: new Date().toISOString(),
        profile: {
          phone: '+1987654321',
          address: '456 Rural Road, Farm Town'
        }
      }
    ];
    writeToStorage(USERS_KEY, defaultUsers);
  }

  if (!localStorage.getItem(FARMS_KEY)) {
    writeToStorage(FARMS_KEY, []);
  }

  if (!localStorage.getItem(CROPS_KEY)) {
    writeToStorage(CROPS_KEY, []);
  }
}

// Initialize storage on module load
initializeStorage();

// User operations
export const userService = {
  async findByEmail(email: string): Promise<User | null> {
    const users = readFromStorage<User>(USERS_KEY);
    return users.find(u => u.email === email) || null;
  },

  async findById(id: string): Promise<User | null> {
    const users = readFromStorage<User>(USERS_KEY);
    return users.find(u => u.id === id) || null;
  },

  async getAllUsers(): Promise<User[]> {
    return readFromStorage<User>(USERS_KEY);
  },

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = readFromStorage<User>(USERS_KEY);
    
    const newUser: User = {
      ...userData,
      id: Date.now().toString(), // Simple ID generation
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeToStorage(USERS_KEY, users);
    return newUser;
  },

  async authenticate(email: string, password: string): Promise<User | null> {
    const users = readFromStorage<User>(USERS_KEY);
    return users.find(u => u.email === email && u.password === password) || null;
  },

  async deleteUser(id: string): Promise<boolean> {
    const users = readFromStorage<User>(USERS_KEY);
    const filteredUsers = users.filter(u => u.id !== id);
    writeToStorage(USERS_KEY, filteredUsers);
    return true;
  }
};

// Farm operations
export const farmService = {
  async findByUserId(userId: string): Promise<Farm[]> {
    const farms = readFromStorage<Farm>(FARMS_KEY);
    return farms.filter(f => f.userId === userId);
  },

  async findById(id: string): Promise<Farm | null> {
    const farms = readFromStorage<Farm>(FARMS_KEY);
    return farms.find(f => f.id === id) || null;
  },

  async getAllFarms(): Promise<Farm[]> {
    return readFromStorage<Farm>(FARMS_KEY);
  },

  async create(farmData: Omit<Farm, 'id' | 'createdAt'>): Promise<Farm> {
    const farms = readFromStorage<Farm>(FARMS_KEY);
    
    const newFarm: Farm = {
      ...farmData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    farms.push(newFarm);
    writeToStorage(FARMS_KEY, farms);
    return newFarm;
  }
};

// Crop operations
export const cropService = {
  async findByFarmId(farmId: string): Promise<Crop[]> {
    const crops = readFromStorage<Crop>(CROPS_KEY);
    return crops.filter(c => c.farmId === farmId);
  },

  async findById(id: string): Promise<Crop | null> {
    const crops = readFromStorage<Crop>(CROPS_KEY);
    return crops.find(c => c.id === id) || null;
  },

  async getAllCrops(): Promise<Crop[]> {
    return readFromStorage<Crop>(CROPS_KEY);
  },

  async create(cropData: Omit<Crop, 'id'>): Promise<Crop> {
    const crops = readFromStorage<Crop>(CROPS_KEY);
    
    const newCrop: Crop = {
      ...cropData,
      id: Date.now().toString()
    };
    
    crops.push(newCrop);
    writeToStorage(CROPS_KEY, crops);
    return newCrop;
  }
};

// Heatmap Cache operations
export const heatmapService = {
  async getByFarmId(farmId: string): Promise<HeatmapCacheEntry | null> {
    const cache = readFromStorage<HeatmapCacheEntry>(HEATMAP_CACHE_KEY);
    return cache.find(c => c.farmId === farmId) || null;
  },

  async save(farmId: string, data: HeatmapCacheEntry['data']): Promise<HeatmapCacheEntry> {
    const cache = readFromStorage<HeatmapCacheEntry>(HEATMAP_CACHE_KEY);
    
    // Remove old entry if exists
    const filteredCache = cache.filter(c => c.farmId !== farmId);
    
    const newEntry: HeatmapCacheEntry = {
      farmId,
      data,
      cachedAt: new Date().toISOString()
    };
    
    filteredCache.push(newEntry);
    writeToStorage(HEATMAP_CACHE_KEY, filteredCache);
    return newEntry;
  },

  async getAllCache(): Promise<HeatmapCacheEntry[]> {
    return readFromStorage<HeatmapCacheEntry>(HEATMAP_CACHE_KEY);
  },

  async clearByFarmId(farmId: string): Promise<boolean> {
    const cache = readFromStorage<HeatmapCacheEntry>(HEATMAP_CACHE_KEY);
    const filteredCache = cache.filter(c => c.farmId !== farmId);
    writeToStorage(HEATMAP_CACHE_KEY, filteredCache);
    return true;
  }
};