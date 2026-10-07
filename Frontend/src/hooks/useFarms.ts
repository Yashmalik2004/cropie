import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFarmStore } from '../stores/farmStore';
import { useGuestFarmStore } from '../stores/guestFarmStore';
import type { Farm, FarmFormData } from '../types/farm';

/**
 * Unified hook for farm operations that automatically switches between
 * authenticated user farms (API-based) and guest farms (localStorage-based)
 */
export const useFarms = () => {
  const { user, isGuestMode } = useAuth();

  // API-based farm store for authenticated users
  const {
    farms: apiFarms,
    currentFarm: apiCurrentFarm,
    loading: apiLoading,
    error: apiError,
    fetchFarms: apiFetchFarms,
    addFarm: apiAddFarm,
    updateFarm: apiUpdateFarm,
    deleteFarm: apiDeleteFarm,
    getFarmById: apiGetFarmById,
    setCurrentFarm: apiSetCurrentFarm,
    clearError: apiClearError,
    clearUserData: apiClearUserData,
  } = useFarmStore();

  // Guest farm store for guest mode
  const {
    farms: guestFarms,
    currentFarm: guestCurrentFarm,
    loading: guestLoading,
    error: guestError,
    fetchGuestFarms,
    addGuestFarm,
    updateGuestFarm,
    deleteGuestFarm,
    getFarmById: guestGetFarmById,
    setCurrentFarm: guestSetCurrentFarm,
    clearError: guestClearError,
    clearGuestData,
  } = useGuestFarmStore();

  // Determine which store to use
  const isUsingGuestMode = isGuestMode;

  console.log('🌍 useFarms: Store selection', {
    isGuestMode,
    isUsingGuestMode,
    userId: user?.id,
  });

  // Unified state
  const farms = isUsingGuestMode ? guestFarms : apiFarms;
  const currentFarm = isUsingGuestMode ? guestCurrentFarm : apiCurrentFarm;
  const loading = isUsingGuestMode ? guestLoading : apiLoading;
  const error = isUsingGuestMode ? guestError : apiError;

  // Simple effect to fetch farms when user changes
  useEffect(() => {
    if (user?.id) {
      if (isUsingGuestMode) {
        fetchGuestFarms();
      } else {
        apiFetchFarms();
      }
    }
  }, [user?.id, isUsingGuestMode, fetchGuestFarms, apiFetchFarms]);

  // Unified methods
  const fetchFarms = useCallback(async () => {
    if (isUsingGuestMode) {
      fetchGuestFarms();
    } else {
      await apiFetchFarms();
    }
  }, [isUsingGuestMode, fetchGuestFarms, apiFetchFarms]);

  const addFarm = useCallback(
    async (farmData: FarmFormData, coordinates: number[][], area: number) => {
      console.log('🌍 useFarms: addFarm called', {
        isUsingGuestMode,
        farmData,
      });

      if (isUsingGuestMode) {
        console.log('👻 useFarms: Calling guest farm creation');
        addGuestFarm(farmData, coordinates, area);
      } else {
        console.log('🔐 useFarms: Calling API farm creation');
        await apiAddFarm(farmData, coordinates, area);
      }

      console.log('✅ useFarms: addFarm completed');
    },
    [isUsingGuestMode, addGuestFarm, apiAddFarm]
  );

  const updateFarm = useCallback(
    async (id: string, farmData: Partial<Farm>) => {
      if (isUsingGuestMode) {
        updateGuestFarm(id, farmData);
      } else {
        await apiUpdateFarm(id, farmData);
      }
    },
    [isUsingGuestMode, updateGuestFarm, apiUpdateFarm]
  );

  const deleteFarm = useCallback(
    async (id: string) => {
      if (isUsingGuestMode) {
        deleteGuestFarm(id);
      } else {
        await apiDeleteFarm(id);
      }
    },
    [isUsingGuestMode, deleteGuestFarm, apiDeleteFarm]
  );

  const getFarmById = useCallback(
    (id: string): Farm | undefined => {
      if (isUsingGuestMode) {
        return guestGetFarmById(id);
      } else {
        return apiGetFarmById(id);
      }
    },
    [isUsingGuestMode, guestGetFarmById, apiGetFarmById]
  );

  const setCurrentFarm = useCallback(
    (farm: Farm | null) => {
      if (isUsingGuestMode) {
        guestSetCurrentFarm(farm);
      } else {
        apiSetCurrentFarm(farm);
      }
    },
    [isUsingGuestMode, guestSetCurrentFarm, apiSetCurrentFarm]
  );

  const clearError = useCallback(() => {
    if (isUsingGuestMode) {
      guestClearError();
    } else {
      apiClearError();
    }
  }, [isUsingGuestMode, guestClearError, apiClearError]);

  const clearAllData = useCallback(() => {
    if (isUsingGuestMode) {
      clearGuestData();
    } else {
      apiClearUserData();
    }
  }, [isUsingGuestMode, clearGuestData, apiClearUserData]);

  return {
    // State
    farms,
    currentFarm,
    loading,
    error,
    isGuestMode: isUsingGuestMode,

    // Methods
    fetchFarms,
    addFarm,
    updateFarm,
    deleteFarm,
    getFarmById,
    setCurrentFarm,
    clearError,
    clearAllData,
  };
};
