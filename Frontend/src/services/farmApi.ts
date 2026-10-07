import { get, post, put, del } from '../utils/api';
import { AuthAPI } from './authApi';
import type { Farm, HeatmapData } from '../types/farm';
import type { ApiFarmData } from '../types/api';

// API Request/Response Types
export interface CreateFarmRequest {
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
  coordinates: number[][];
  area: number;
}

export interface UpdateFarmRequest {
  name?: string;
  crop?: string;
  plantingDate?: string;
  harvestDate?: string;
  description?: string;
  coordinates?:
    | number[][]
    | {
        type: 'Polygon';
        coordinates: number[][][];
      };
  area?: number;
}

export interface FarmResponse {
  code: number;
  message: string;
  result:
    | Farm
    | Farm[]
    | {
        farms: Farm[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
}

export interface PaginatedFarmsResponse {
  code: number;
  message: string;
  result: {
    farms: Farm[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Farm API Service
 */
export class FarmAPI {
  /**
   * Get all farms in the system (admin)
   */
  static async getAllFarms(
    page = 1,
    limit = 10
  ): Promise<PaginatedFarmsResponse> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await get<PaginatedFarmsResponse>(
        `/farms/all?page=${page}&limit=${limit}`,
        authConfig
      );
      return response;
    } catch (error) {
      console.error('Error fetching all farms:', error);
      throw error;
    }
  }
  /**
   * Get all farms for authenticated user
   */
  static async getFarms(page = 1, limit = 10): Promise<PaginatedFarmsResponse> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await get<PaginatedFarmsResponse>(
        `/farms?page=${page}&limit=${limit}`,
        authConfig
      );
      return response;
    } catch (error) {
      console.error('Error fetching farms:', error);
      throw error;
    }
  }

  /**
   * Get single farm by ID
   */
  static async getFarm(id: string): Promise<FarmResponse> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await get<FarmResponse>(`/farms/${id}`, authConfig);
      return response;
    } catch (error) {
      console.error('Error fetching farm:', error);
      throw error;
    }
  }

  /**
   * Create new farm
   */
  static async createFarm(farmData: CreateFarmRequest): Promise<FarmResponse> {
    try {
      console.log('📤 FarmAPI.createFarm called with:', farmData);
      
      const authConfig = {
        ...AuthAPI.getAuthConfig(),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthAPI.getToken()}`,
        },
        withCredentials: true,
        timeout: 60000, // Increase timeout to 60 seconds for farm creation
      };
      
      console.log('🔑 Auth config for farm creation:', {
        hasToken: !!AuthAPI.getToken(),
        withCredentials: authConfig.withCredentials,
        timeout: authConfig.timeout
      });

      const response = await post<FarmResponse>('/farms', farmData, authConfig);
      console.log('✅ FarmAPI.createFarm response:', response);
      return response;
    } catch (error) {
      console.error('❌ FarmAPI.createFarm error details:', {
        error: error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        farmData: farmData
      });
      throw error;
    }
  }

  /**
   * Update existing farm
   */
  /**
   * Update existing farm
   */
  static async updateFarm(
    id: string,
    farmData: UpdateFarmRequest
  ): Promise<FarmResponse> {
    try {
      const authConfig = {
        ...AuthAPI.getAuthConfig(),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthAPI.getToken()}`,
        },
        withCredentials: true,
      };

      // Format coordinates properly for the backend if they exist
      let formattedData: UpdateFarmRequest = { ...farmData };

      if (
        formattedData.description === undefined &&
        farmData.description === undefined
      ) {
        formattedData.description = '';
      }

      if (
        formattedData.coordinates &&
        Array.isArray(formattedData.coordinates) &&
        formattedData.coordinates.length > 0
      ) {
        // Ensure the polygon is closed (first point equals last point)
        const coords = [...formattedData.coordinates];

        // Check if the polygon is not already closed
        const firstPoint = coords[0] || [0, 0];
        const lastPoint = coords[coords.length - 1] || [0, 0];

        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          // Add the first point again to close the loop
          coords.push([...firstPoint]);
        }

        formattedData = {
          ...formattedData,
          coordinates: {
            type: 'Polygon',
            coordinates: [coords],
          },
        };
      }

      const response = await put<FarmResponse>(
        `/farms/${id}`,
        formattedData,
        authConfig
      );
      return response;
    } catch (error) {
      console.error('Error updating farm:', error);
      throw error;
    }
  }

  /**
   * Get cached heatmap data for a farm from MongoDB
   */
  static async getHeatmapCache(
    farmId: string
  ): Promise<{ data: HeatmapData; cachedAt: string } | null> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await get<{
        code: number;
        message: string;
        result: { data: HeatmapData; cachedAt: string };
      }>(`/farms/${farmId}/heatmap`, authConfig);
      if (response.code === 1) return response.result;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Save heatmap data for a farm to MongoDB
   */
  static async saveHeatmapCache(
    farmId: string,
    data: HeatmapData
  ): Promise<string | null> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await post<{
        code: number;
        message: string;
        result: { cachedAt: string };
      }>(`/farms/${farmId}/heatmap`, { data }, authConfig);
      if (response.code === 1) return response.result.cachedAt;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete farm
   */
  static async deleteFarm(id: string): Promise<FarmResponse> {
    try {
      const authConfig = AuthAPI.getAuthConfig();
      const response = await del<FarmResponse>(`/farms/${id}`, authConfig);
      return response;
    } catch (error) {
      console.error('Error deleting farm:', error);
      throw error;
    }
  }

  /**
   * Transform frontend farm data to API format
   */
  static transformToApiFormat(
    farmData: Partial<Farm> & { coordinates: number[][]; area: number }
  ): CreateFarmRequest {
    // Validate required fields
    if (!farmData.name || !farmData.crop || !farmData.plantingDate || !farmData.harvestDate) {
      throw new Error('Missing required farm fields: name, crop, plantingDate, harvestDate');
    }
    
    if (!farmData.coordinates || !Array.isArray(farmData.coordinates) || farmData.coordinates.length < 3) {
      throw new Error('Invalid coordinates: must be an array with at least 3 points');
    }
    
    if (!farmData.area || farmData.area <= 0) {
      throw new Error('Invalid area: must be greater than 0');
    }
    
    const transformed = {
      name: farmData.name.trim(),
      crop: farmData.crop.trim(),
      plantingDate: farmData.plantingDate,
      harvestDate: farmData.harvestDate,
      description: farmData.description?.trim() ?? '',
      coordinates: farmData.coordinates,
      area: farmData.area,
    };
    
    console.log('🔄 Transformed farm data:', transformed);
    return transformed;
  }

  /**
   * Transform API response to frontend format
   */
  static transformFromApiFormat(apiData: ApiFarmData): Farm {
    let userId = apiData.userId;
    if (userId && typeof userId === 'object' && '_id' in userId) {
      userId = userId._id;
    }
    return {
      id: apiData._id || apiData.id,
      name: apiData.name,
      crop: apiData.crop,
      plantingDate: apiData.plantingDate,
      harvestDate: apiData.harvestDate,
      description: apiData.description ?? '',
      coordinates:
        typeof apiData.coordinates === 'object' &&
        'coordinates' in apiData.coordinates &&
        Array.isArray(apiData.coordinates.coordinates)
          ? apiData.coordinates.coordinates[0] || []
          : Array.isArray(apiData.coordinates)
            ? apiData.coordinates
            : [],
      area: typeof apiData.area === 'number' ? apiData.area : 0, // Ensure area is always a number
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      userId: typeof userId === 'string' ? userId : '',
    };
  }
}

export default FarmAPI;
