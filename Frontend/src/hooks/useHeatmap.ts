import { useState, useCallback, useEffect } from 'react';
import { FarmAPI } from '../services/farmApi';
import { heatmapService } from '../services/fileDatabase'; // kept for guest mode (localStorage)
import type { HeatmapData } from '../types/farm';

type LegacyHeatmapData = HeatmapData & {
  news_analysis?: string;
  mandi_analysis?: string;
};

const normalizeHeatmapData = (raw: unknown): HeatmapData => {
  const topLevel = (raw ?? {}) as Record<string, unknown>;
  const nestedData =
    topLevel.data && typeof topLevel.data === 'object'
      ? (topLevel.data as Record<string, unknown>)
      : null;

  const source =
    nestedData &&
    ('masks' in nestedData || 'pixel_counts' in nestedData)
      ? (nestedData as unknown as LegacyHeatmapData)
      : (topLevel as unknown as LegacyHeatmapData);

  return {
    ...source,
    news_ai_analysis:
      typeof source.news_ai_analysis === 'string'
        ? source.news_ai_analysis
        : typeof source.news_analysis === 'string'
          ? source.news_analysis
          : undefined,
    mandi_ai_analysis:
      typeof source.mandi_ai_analysis === 'string'
        ? source.mandi_ai_analysis
        : typeof source.mandi_analysis === 'string'
          ? source.mandi_analysis
          : undefined,
  } as HeatmapData;
};

export interface UseHeatmapReturn {
  heatmapData: HeatmapData | null;
  loading: boolean;
  error: string | null;
  isCached: boolean;
  cachedAt: string | null;
  fetchHeatmapData: (
    coordinates: number[][],
    t1?: number,
    t2?: number,
    cultivation_date?: string,
    harvest_date?: string,
    crop?: string
  ) => Promise<void>;
}

export const useHeatmap = (farmId?: string): UseHeatmapReturn => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Load cached data on mount if farmId is provided
  useEffect(() => {
    if (farmId) {
      const loadCachedData = async () => {
        try {
          const isAuthenticated = !!(
            typeof window !== 'undefined' &&
            localStorage.getItem('auth_token') &&
            localStorage.getItem('auth_user')
          );

          if (isAuthenticated) {
            // Load from MongoDB via backend
            const cached = await FarmAPI.getHeatmapCache(farmId);
            if (cached) {
              setHeatmapData(normalizeHeatmapData(cached.data));
              setIsCached(true);
              setCachedAt(cached.cachedAt);
              console.log(
                '📦 Loaded heatmap cache from MongoDB for farm:',
                farmId
              );
            }
          } else {
            // Guest mode: fall back to localStorage
            const cached = await heatmapService.getByFarmId(farmId);
            if (cached) {
              setHeatmapData(normalizeHeatmapData(cached.data));
              setIsCached(true);
              setCachedAt(cached.cachedAt);
              console.log(
                '📦 Loaded heatmap cache from localStorage (guest) for farm:',
                farmId
              );
            }
          }
        } catch (err) {
          console.error('Error loading cached heatmap data:', err);
        }
      };
      loadCachedData();
    }
  }, [farmId]);

  const fetchHeatmapData = useCallback(
    async (
      coordinates: number[][],
      t1: number = 0.5,
      t2: number = 0.75,
      cultivation_date?: string,
      harvest_date?: string,
      crop?: string
    ) => {
      setLoading(true);
      setError(null);

      const toDateOnly = (value?: string): string | undefined => {
        if (!value) return undefined;
        const match = value.match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : undefined;
      };

      const clampDate = (value: string, min: string, max: string): string => {
        if (value < min) return min;
        if (value > max) return max;
        return value;
      };

      const buildPayload = (
        coordinatesParam: number[][],
        t1Param: number,
        t2Param: number,
        cultivationDateParam?: string,
        harvestDateParam?: string,
        cropParam?: string
      ) => ({
        coordinates: coordinatesParam,
        t1: t1Param,
        t2: t2Param,
        ...(cultivationDateParam && { cultivation_date: cultivationDateParam }),
        ...(harvestDateParam && { harvest_date: harvestDateParam }),
        ...(cropParam && { crop: cropParam }),
      });

      const requestHeatmap = async (
        payload: ReturnType<typeof buildPayload>
      ): Promise<Response> => {
        return fetch('http://127.0.0.1:8000/generate_heatmap_lite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      };

      try {
        const safeCultivationDate = toDateOnly(cultivation_date);
        const safeHarvestDate = toDateOnly(harvest_date);

        let response = await requestHeatmap(
          buildPayload(
            coordinates,
            t1,
            t2,
            safeCultivationDate,
            safeHarvestDate,
            crop
          )
        );

        if (!response.ok) {
          let backendDetail = '';
          let backendReason = '';

          try {
            const errorBody = await response.json();
            backendReason =
              errorBody?.reason ||
              errorBody?.detail?.reason ||
              errorBody?.detail ||
              errorBody?.message ||
              '';
            backendDetail = String(backendReason || '').trim();
          } catch {
            // Ignore JSON parsing errors for non-JSON responses.
          }

          // Auto-retry once with clamped dates if backend reports allowed range.
          const rangeMatch = backendDetail.match(
            /allowed range from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/i
          );

          if (rangeMatch) {
            const minAllowed = rangeMatch[1]!;
            const maxAllowed = rangeMatch[2]!;

            const originalStart = safeCultivationDate || minAllowed;
            const originalEnd = safeHarvestDate || maxAllowed;

            let clampedStart = clampDate(originalStart, minAllowed, maxAllowed);
            let clampedEnd = clampDate(originalEnd, minAllowed, maxAllowed);

            if (clampedStart > clampedEnd) {
              clampedStart = minAllowed;
              clampedEnd = maxAllowed;
            }

            response = await requestHeatmap(
              buildPayload(coordinates, t1, t2, clampedStart, clampedEnd, crop)
            );

            if (response.ok) {
              console.warn(
                `Heatmap date range auto-adjusted to ${clampedStart}..${clampedEnd}`
              );
            } else {
              const retryMessage = backendDetail
                ? `Heatmap API error (${response.status}): ${backendDetail}`
                : `Heatmap API error (${response.status})`;
              throw new Error(retryMessage);
            }
          } else {
            const message = backendDetail
              ? `Heatmap API error (${response.status}): ${backendDetail}`
              : `Heatmap API error (${response.status})`;
            throw new Error(message);
          }
        }

        const rawData = await response.json();
        const data = normalizeHeatmapData(rawData);
        setHeatmapData(data);
        setIsCached(false);
        setCachedAt(null);

        // Cache the data if farmId is provided
        if (farmId) {
          try {
            const isAuthenticated = !!(
              typeof window !== 'undefined' &&
              localStorage.getItem('auth_token') &&
              localStorage.getItem('auth_user')
            );

            if (isAuthenticated) {
              // Save to MongoDB via backend
              const savedAt = await FarmAPI.saveHeatmapCache(farmId, data);
              console.log('💾 Heatmap data saved to MongoDB for farm:', farmId);
              setCachedAt(savedAt);
            } else {
              // Guest mode: save to localStorage
              const cachedEntry = await heatmapService.save(farmId, data);
              console.log(
                '💾 Heatmap data cached in localStorage (guest) for farm:',
                farmId
              );
              setCachedAt(cachedEntry.cachedAt);
            }
          } catch (cacheErr) {
            console.error('Error caching heatmap data:', cacheErr);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'An error occurred while fetching heatmap data';
        setError(errorMessage);
        console.error('Heatmap fetch error:', err);

        // If fetch fails and we have cached data, keep it visible
        if (heatmapData) {
          setIsCached(true);
          console.log('⚠️ Fetch failed, using cached heatmap data');
        }
      } finally {
        setLoading(false);
      }
    },
    [farmId, heatmapData]
  );

  return {
    heatmapData,
    loading,
    error,
    isCached,
    cachedAt,
    fetchHeatmapData,
  };
};
