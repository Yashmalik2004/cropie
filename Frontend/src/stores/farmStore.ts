import { create } from 'zustand';
import { FarmAPI } from '../services/farmApi';
import type { Farm, FarmState, FarmFormData } from '../types/farm';
import {
  loadGuestFarms,
  calculatePolygonArea,
  GuestFarmStorage,
} from '../utils/guestFarmStorage';

export const useFarmStore = create<FarmState>((set, get) => ({
  fetchAllFarms: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await FarmAPI.getAllFarms(page, limit);
      if (response.code === 1) {
        const { farms, pagination } = response.result;
        const transformedFarms = farms.map(FarmAPI.transformFromApiFormat);
        set({ allFarms: transformedFarms, pagination, loading: false });
      } else {
        set({
          error: response.message || 'Failed to fetch all farms',
          loading: false,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch all farms';
      console.error('Error fetching all farms:', error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },
  guestMode:
    typeof window !== 'undefined' && !localStorage.getItem('auth_token'),
  farms: [],
  allFarms: [],
  currentFarm: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  fetchFarms: async (page = 1, limit = 10) => {
    // Prevent multiple simultaneous calls

    if (get().loading) {
      return;
    }

    try {
      // Check current authentication status dynamically
      const isAuthenticated = !!(
        typeof window !== 'undefined' &&
        localStorage.getItem('auth_token') &&
        localStorage.getItem('auth_user')
      );

      console.log(
        '🏠 farmStore: fetchFarms - isAuthenticated:',
        isAuthenticated,
        'current guestMode:',
        get().guestMode
      );

      // Use guest mode if not authenticated
      if (!isAuthenticated) {
        console.log('👨‍💼 farmStore: User not authenticated, using guest mode');
        set({ loading: true, error: null, guestMode: true });
        const guestFarms = loadGuestFarms().map(farm => ({
          ...farm,
          userId: 'guest',
        }));
        set({
          farms: guestFarms,
          loading: false,
          pagination: {
            page: 1,
            limit: 100,
            total: guestFarms.length,
            totalPages: 1,
          },
        });
        return;
      }

      // User is authenticated - fetch from API and ensure guestMode is false
      console.log('🔐 farmStore: User authenticated, fetching from API');
      set({ loading: true, error: null, guestMode: false });
      const response = await FarmAPI.getFarms(page, limit);

      if (response.code === 1) {
        const { farms, pagination } = response.result;
        const transformedFarms = farms.map(FarmAPI.transformFromApiFormat);
        console.log(
          '✅ farmStore: Successfully fetched',
          transformedFarms.length,
          'authenticated user farms'
        );
        set({ farms: transformedFarms, pagination, loading: false });
      } else {
        set({
          error: response.message || 'Failed to fetch farms',
          loading: false,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch farms';
      console.error('❌ farmStore: Error fetching farms:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  addFarm: async (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => {
    // Prevent duplicate farm creation
    if (get().loading) {
      console.log(
        '❌ Farm creation already in progress, skipping duplicate call'
      );
      return;
    }

    // Check for duplicate farm names to prevent accidental duplicates
    const existingFarms = get().farms;
    const duplicateName = existingFarms.find(farm => 
      farm.name.toLowerCase().trim() === farmData.name.toLowerCase().trim()
    );
    
    if (duplicateName) {
      console.warn('⚠️ Farm with similar name already exists:', duplicateName.name);
      set({ error: `A farm named "${duplicateName.name}" already exists. Please choose a different name.` });
      return;
    }

    console.log('🌱 farmStore: Starting farm creation', { farmData, area });

    if (get().guestMode) {
      console.log('👻 farmStore: Creating guest farm');
      set({ loading: true, error: null });
      GuestFarmStorage.addFarm(
        farmData,
        coordinates,
        area || calculatePolygonArea(coordinates)
      );
      const guestFarms = loadGuestFarms().map(farm => ({
        ...farm,
        userId: 'guest',
      }));
      console.log(
        '✅ farmStore: Guest farm created, total farms:',
        guestFarms.length
      );
      set({ farms: guestFarms, loading: false });
      return;
    }

    try {
      console.log('🔐 farmStore: Creating authenticated user farm');
      set({ loading: true, error: null });

      const createRequest = FarmAPI.transformToApiFormat({
        ...farmData,
        coordinates,
        area: area || calculatePolygonArea(coordinates),
      });

      console.log('📤 farmStore: Sending API request to create farm');
      const response = await FarmAPI.createFarm(createRequest);

      if (response.code === 1) {
        console.log('✅ farmStore: Farm created successfully via API');
        // Backend's create controller returns { farm, ... } - unwrap to the
        // Farm doc before transforming.
        const raw = response.result as unknown;
        const farmPayload =
          raw && typeof raw === 'object' && 'farm' in raw
            ? ((raw as { farm: Farm }).farm as Farm)
            : (raw as Farm);
        const newFarm = FarmAPI.transformFromApiFormat(farmPayload);
        const currentFarms = get().farms;

        console.log(
          '📝 farmStore: Adding farm to state, current farms:',
          currentFarms.length
        );
        set({
          farms: [...currentFarms, newFarm],
          loading: false,
        });
        console.log(
          '✅ farmStore: Farm added to state, new total:',
          currentFarms.length + 1
        );

        // Remove the fetchAllFarms call that might be causing duplication
        // Only refetch all farms for admin dashboard if function exists and not already loading
        // if (typeof get().fetchAllFarms === 'function') {
        //   // Use setTimeout to prevent potential infinite loops
        //   setTimeout(() => {
        //     get().fetchAllFarms();
        //   }, 100);
        // }
      } else {
        console.error('❌ farmStore: Farm creation failed:', response.message);
        set({
          error: response.message || 'Failed to create farm',
          loading: false,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create farm';
      console.error('❌ farmStore: Error creating farm:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  updateFarm: async (id: string, farmData: Partial<Farm>) => {
    if (get().guestMode) {
      set({ loading: true, error: null });
      GuestFarmStorage.updateFarm(id, farmData);
      const guestFarms = loadGuestFarms().map(farm => ({
        ...farm,
        userId: 'guest',
      }));
      set({
        farms: guestFarms,
        currentFarm: guestFarms.find(f => f.id === id) || null,
        loading: false,
      });
      return;
    }
    try {
      set({ loading: true, error: null });
      const response = await FarmAPI.updateFarm(id, farmData);
      if (response.code === 1) {
        // The update controller wraps the doc as { farm, geospatialAnalysis }
        // while other endpoints return the doc directly. Tolerate both so a
        // wrapper response doesn't get treated as the Farm itself, which
        // would silently zero out coordinates and area.
        const raw = response.result as unknown;
        const farmPayload =
          raw && typeof raw === 'object' && 'farm' in raw
            ? ((raw as { farm: Farm }).farm as Farm)
            : (raw as Farm);
        const updatedFarm = FarmAPI.transformFromApiFormat(farmPayload);
        set({
          farms: get().farms.map((farm: Farm) =>
            farm.id === id ? updatedFarm : farm
          ),
          currentFarm:
            get().currentFarm?.id === id ? updatedFarm : get().currentFarm,
          loading: false,
        });
      } else {
        set({
          error: response.message || 'Failed to update farm',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error updating farm:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update farm',
        loading: false,
      });
    }
  },
  deleteFarm: async (id: string) => {
    if (get().guestMode) {
      set({ loading: true, error: null });
      GuestFarmStorage.deleteFarm(id);
      const guestFarms = loadGuestFarms().map(farm => ({
        ...farm,
        userId: 'guest',
      }));
      set({
        farms: guestFarms,
        currentFarm: get().currentFarm?.id === id ? null : get().currentFarm,
        loading: false,
      });
      return;
    }
    try {
      set({ loading: true, error: null });
      const response = await FarmAPI.deleteFarm(id);
      if (response.code === 1) {
        set({
          farms: get().farms.filter((farm: Farm) => farm.id !== id),
          currentFarm: get().currentFarm?.id === id ? null : get().currentFarm,
          loading: false,
        });
      } else {
        set({
          error: response.message || 'Failed to delete farm',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error deleting farm:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete farm',
        loading: false,
      });
    }
  },
  getFarmById: (id: string) => {
    const userFarm = get().farms.find((farm: Farm) => farm.id === id);
    if (userFarm) return userFarm;
    return get().allFarms.find((farm: Farm) => farm.id === id);
  },
  setCurrentFarm: (farm: Farm | null) => {
    set({ currentFarm: farm });
  },
  clearError: () => {
    set({ error: null });
  },
  clearUserData: () => {
    set({
      farms: [],
      currentFarm: null,
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      guestMode:
        typeof window !== 'undefined' && !localStorage.getItem('auth_token'),
    });
  },
  setPagination: (pagination: Partial<FarmState['pagination']>) => {
    set({ pagination: { ...get().pagination, ...pagination } });
  },
  setGuestMode: (isGuest: boolean) => {
    set({ guestMode: isGuest });
  },
  clearAllData: () => {
    set({
      farms: [],
      allFarms: [],
      currentFarm: null,
      loading: false,
      error: null,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      guestMode:
        typeof window !== 'undefined' && !localStorage.getItem('auth_token'),
    });
  },
}));
