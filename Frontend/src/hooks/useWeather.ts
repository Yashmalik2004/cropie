import { useState, useCallback } from 'react';

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  surfacePressure: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
  uvIndexMax: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  timezone: string;
  latitude: number;
  longitude: number;
}

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', lat.toString());
      url.searchParams.set('longitude', lon.toString());
      url.searchParams.set(
        'current',
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,surface_pressure'
      );
      url.searchParams.set(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max'
      );
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('forecast_days', '7');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch weather data');

      const data = await res.json();

      const current: CurrentWeather = {
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        weatherCode: data.current.weather_code,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        uvIndex: data.current.uv_index,
        surfacePressure: data.current.surface_pressure,
      };

      const daily: DailyForecast[] = (data.daily.time as string[]).map(
        (date, i) => ({
          date,
          weatherCode: data.daily.weather_code[i],
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
          precipitationSum: data.daily.precipitation_sum[i],
          precipitationProbability: data.daily.precipitation_probability_max[i],
          windSpeedMax: data.daily.wind_speed_10m_max[i],
          uvIndexMax: data.daily.uv_index_max[i],
        })
      );

      setWeatherData({
        current,
        daily,
        timezone: data.timezone,
        latitude: lat,
        longitude: lon,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Weather fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { weatherData, loading, error, fetchWeather };
};
