import { useState, useCallback } from 'react';

export type DayAvailability = 'historical' | 'forecast' | 'unavailable';

export interface DayWeather {
  date: string; // "YYYY-MM-DD"
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number | null; // null for historical (not provided by archive API)
  windSpeedMax: number;
  uvIndexMax: number;
  availability: DayAvailability;
}

export interface WeatherCalendarData {
  days: Record<string, DayWeather>; // keyed by "YYYY-MM-DD"
  plantingDate: string;
  harvestDate: string;
  latitude: number;
  longitude: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'wind_speed_10m_max',
  'uv_index_max',
].join(',');

const FORECAST_EXTRA = ',precipitation_probability_max';

async function fetchArchive(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<DayWeather[]> {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('daily', DAILY_FIELDS);
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Archive API error: ${res.status}`);
  const data = await res.json();

  return (data.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i] ?? 0,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    precipitationProbability: null,
    windSpeedMax: data.daily.wind_speed_10m_max[i] ?? 0,
    uvIndexMax: data.daily.uv_index_max[i] ?? 0,
    availability: 'historical' as DayAvailability,
  }));
}

async function fetchForecastRange(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<DayWeather[]> {
  const runForecastRequest = async (from: string, to: string) => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set('start_date', from);
    url.searchParams.set('end_date', to);
    url.searchParams.set('daily', DAILY_FIELDS + FORECAST_EXTRA);
    url.searchParams.set('timezone', 'auto');
    return fetch(url.toString());
  };

  const clampDate = (value: string, min: string, max: string): string => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  let res = await runForecastRequest(startDate, endDate);

  if (!res.ok) {
    let backendReason = '';
    try {
      const body = await res.json();
      backendReason = String(
        body?.reason ||
          body?.detail?.reason ||
          body?.detail ||
          body?.message ||
          ''
      );
    } catch {
      // Ignore parsing errors for non-JSON responses.
    }

    const rangeMatch = backendReason.match(
      /allowed range from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/i
    );

    if (rangeMatch) {
      const minAllowed = rangeMatch[1]!;
      const maxAllowed = rangeMatch[2]!;
      const clampedStart = clampDate(startDate, minAllowed, maxAllowed);
      const clampedEnd = clampDate(endDate, minAllowed, maxAllowed);

      if (clampedStart <= clampedEnd) {
        res = await runForecastRequest(clampedStart, clampedEnd);
      } else {
        return [];
      }
    }
  }

  if (!res.ok) {
    throw new Error(`Forecast API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.daily.time as string[]).map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i] ?? 0,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    precipitationProbability:
      data.daily.precipitation_probability_max?.[i] ?? null,
    windSpeedMax: data.daily.wind_speed_10m_max[i] ?? 0,
    uvIndexMax: data.daily.uv_index_max[i] ?? 0,
    availability: 'forecast' as DayAvailability,
  }));
}

// ─── hook ────────────────────────────────────────────────────────────────────

export const useWeatherCalendar = () => {
  const [calendarData, setCalendarData] = useState<WeatherCalendarData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(
    async (
      lat: number,
      lon: number,
      plantingDate: string,
      harvestDate: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = toDateStr(today);
        const yesterday = addDays(today, -1);

        // Open-Meteo forecast supports up to 15 days including today (0..14 ahead)
        const maxForecastDate = addDays(today, 14);

        const plant = new Date(plantingDate + 'T00:00:00');
        const harvest = new Date(harvestDate + 'T00:00:00');

        const days: Record<string, DayWeather> = {};

        // 1. Historical: plant → yesterday (clamped to harvest)
        const histStart = plant;
        const histEnd = minDate(yesterday, harvest);
        if (histStart <= histEnd) {
          const historicalDays = await fetchArchive(
            lat,
            lon,
            toDateStr(histStart),
            toDateStr(histEnd)
          );
          historicalDays.forEach(d => {
            days[d.date] = d;
          });
        }

        // 2. Forecast: max(today,plant) → min(maxForecastDate, harvest)
        const fcStart = maxDate(today, plant);
        const fcEnd = minDate(maxForecastDate, harvest);
        if (fcStart <= fcEnd) {
          const forecastDays = await fetchForecastRange(
            lat,
            lon,
            toDateStr(fcStart),
            toDateStr(fcEnd)
          );
          forecastDays.forEach(d => {
            days[d.date] = d;
          });
        }

        // 3. Unavailable: maxForecastDate+1 → harvest
        const unavailStart = addDays(maxForecastDate, 1);
        if (unavailStart <= harvest) {
          const cur = new Date(unavailStart);
          while (cur <= harvest) {
            const dateStr = toDateStr(cur);
            days[dateStr] = {
              date: dateStr,
              weatherCode: -1,
              tempMax: 0,
              tempMin: 0,
              precipitationSum: 0,
              precipitationProbability: null,
              windSpeedMax: 0,
              uvIndexMax: 0,
              availability: 'unavailable',
            };
            cur.setDate(cur.getDate() + 1);
          }
        }

        // Ensure today gets forecast data even if planting is in the future
        if (plant > today && !days[todayStr]) {
          // nothing to do — today is before planting
        }

        setCalendarData({
          days,
          plantingDate,
          harvestDate,
          latitude: lat,
          longitude: lon,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch weather'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { calendarData, loading, error, fetchCalendar };
};
