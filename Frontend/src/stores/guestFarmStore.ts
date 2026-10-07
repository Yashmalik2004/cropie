import { create } from 'zustand';
import { GuestFarmStorage, type GuestFarm } from '../utils/guestFarmStorage';
import type { Farm, FarmState, FarmFormData } from '../types/farm';

interface GuestFarmStore extends FarmState {
  // Guest-specific CRUD operations
  addGuestFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => void;
  updateGuestFarm: (
    id: string,
    farmData: Partial<
      FarmFormData & { coordinates?: number[][]; area?: number }
    >
  ) => void;
  deleteGuestFarm: (id: string) => void;
  fetchGuestFarms: () => void;

  // Local state management
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearGuestData: () => void;
}

// Utility function to convert GuestFarm to Farm for consistency
const convertGuestFarmToFarm = (guestFarm: GuestFarm): Farm => ({
  ...guestFarm,
  userId: 'guest', // Ensure userId is consistent
});

export const useGuestFarmStore = create<GuestFarmStore>((set, get) => ({
  // State
  farms: [],
  allFarms: [], // Same as farms for guest mode
  currentFarm: null,
  loading: false,
  error: null,
  guestMode: true, // Always true for guest store
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  // Fetch guest farms from localStorage
  fetchGuestFarms: () => {
    try {
      set({ loading: true, error: null });
      const guestFarms = GuestFarmStorage.getFarms();
      const farms = guestFarms.map(convertGuestFarmToFarm);

      set({
        farms,
        allFarms: farms, // Same as farms for guest mode
        loading: false,
        pagination: {
          page: 1,
          limit: farms.length || 10,
          total: farms.length,
          totalPages: Math.ceil(farms.length / 10) || 1,
        },
      });

      console.log(`📱 Loaded ${farms.length} guest farms from localStorage`);
    } catch (error: unknown) {
      console.error('Error fetching guest farms:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch guest farms',
        loading: false,
      });
    }
  },

  // FarmState required methods (adapted for guest mode)
  fetchFarms: async () => {
    // For guest mode, this is the same as fetchGuestFarms but async
    return new Promise<void>(resolve => {
      get().fetchGuestFarms();
      resolve();
    });
  },

  fetchAllFarms: async (page = 1, limit = 10) => {
    // For guest mode, this is the same as fetchFarms
    return get().fetchFarms(page, limit);
  },

  addFarm: async (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => {
    // Async wrapper around addGuestFarm
    return new Promise<void>((resolve, reject) => {
      try {
        get().addGuestFarm(farmData, coordinates, area);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  updateFarm: async (id: string, farmData: Partial<Farm>) => {
    // Async wrapper around updateGuestFarm
    return new Promise<void>((resolve, reject) => {
      try {
        get().updateGuestFarm(id, farmData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteFarm: async (id: string) => {
    // Async wrapper around deleteGuestFarm
    return new Promise<void>((resolve, reject) => {
      try {
        get().deleteGuestFarm(id);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  addGuestFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => {
    try {
      console.log('👻 guestFarmStore: Starting guest farm creation', {
        farmData,
        area,
      });
      set({ loading: true, error: null });

      const guestFarm = GuestFarmStorage.addFarm(farmData, coordinates, area);
      const newFarm = convertGuestFarmToFarm(guestFarm);

      console.log('📝 guestFarmStore: Adding guest farm to state', newFarm);

      set(state => {
        const updatedFarms = [...state.farms, newFarm];
        console.log(
          '✅ guestFarmStore: Guest farm added, total farms:',
          updatedFarms.length
        );
        return {
          farms: updatedFarms,
          allFarms: updatedFarms,
          loading: false,
          pagination: {
            ...state.pagination,
            total: updatedFarms.length,
            totalPages: Math.ceil(updatedFarms.length / state.pagination.limit),
          },
        };
      });

      console.log('✅ guestFarmStore: Added guest farm:', newFarm.name);
    } catch (error: unknown) {
      console.error('❌ guestFarmStore: Error adding guest farm:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create farm',
        loading: false,
      });
    }
  },

  updateGuestFarm: (
    id: string,
    farmData: Partial<
      FarmFormData & { coordinates?: number[][]; area?: number }
    >
  ) => {
    try {
      set({ loading: true, error: null });

      const updatedGuestFarm = GuestFarmStorage.updateFarm(id, farmData);

      if (updatedGuestFarm) {
        const updatedFarm = convertGuestFarmToFarm(updatedGuestFarm);

        set(state => {
          const updatedFarms = state.farms.map(farm =>
            farm.id === id ? updatedFarm : farm
          );
          return {
            farms: updatedFarms,
            allFarms: updatedFarms,
            currentFarm:
              state.currentFarm?.id === id ? updatedFarm : state.currentFarm,
            loading: false,
          };
        });

        console.log('✅ Updated guest farm:', updatedFarm.name);
      } else {
        set({
          error: 'Farm not found',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error updating guest farm:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update farm',
        loading: false,
      });
    }
  },

  deleteGuestFarm: (id: string) => {
    try {
      set({ loading: true, error: null });

      const success = GuestFarmStorage.deleteFarm(id);

      if (success) {
        set(state => {
          const updatedFarms = state.farms.filter(farm => farm.id !== id);
          return {
            farms: updatedFarms,
            allFarms: updatedFarms,
            currentFarm:
              state.currentFarm?.id === id ? null : state.currentFarm,
            loading: false,
            pagination: {
              ...state.pagination,
              total: updatedFarms.length,
              totalPages: Math.ceil(
                updatedFarms.length / state.pagination.limit
              ),
            },
          };
        });

        console.log('✅ Deleted guest farm:', id);
      } else {
        set({
          error: 'Farm not found',
          loading: false,
        });
      }
    } catch (error: unknown) {
      console.error('Error deleting guest farm:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete farm',
        loading: false,
      });
    }
  },

  // Local state management
  getFarmById: (id: string) => {
    return get().farms.find(farm => farm.id === id);
  },

  setCurrentFarm: (farm: Farm | null) => {
    set({ currentFarm: farm });
  },

  clearError: () => {
    set({ error: null });
  },

  clearGuestData: () => {
    GuestFarmStorage.clearAllFarms();
    set({
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
    });
  },

  // Additional FarmState required methods
  clearUserData: () => {
    // Alias for clearGuestData in guest mode
    get().clearGuestData();
  },

  setPagination: (pagination: Partial<FarmState['pagination']>) => {
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  setGuestMode: (isGuest: boolean) => {
    set({ guestMode: isGuest });
  },

  clearAllData: () => {
    // Alias for clearGuestData
    get().clearGuestData();
  },
}));
