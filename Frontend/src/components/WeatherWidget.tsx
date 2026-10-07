import React from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  Umbrella,
  RefreshCw,
  CloudSun,
  CloudDrizzle,
} from 'lucide-react';
import type { WeatherData } from '../hooks/useWeather';

interface WeatherCondition {
  label: string;
  icon: React.ReactNode;
  gradient: string;
}

function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0)
    return {
      label: 'Clear Sky',
      icon: <Sun className="h-full w-full" />,
      gradient: 'from-amber-400 via-orange-400 to-orange-500',
    };
  if (code <= 3)
    return {
      label: 'Partly Cloudy',
      icon: <CloudSun className="h-full w-full" />,
      gradient: 'from-sky-400 via-sky-500 to-blue-500',
    };
  if (code <= 48)
    return {
      label: 'Foggy',
      icon: <Cloud className="h-full w-full" />,
      gradient: 'from-slate-400 via-slate-500 to-slate-600',
    };
  if (code <= 55)
    return {
      label: 'Drizzle',
      icon: <CloudDrizzle className="h-full w-full" />,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
    };
  if (code <= 65)
    return {
      label: 'Rain',
      icon: <CloudRain className="h-full w-full" />,
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    };
  if (code <= 77)
    return {
      label: 'Snow',
      icon: <CloudSnow className="h-full w-full" />,
      gradient: 'from-slate-300 via-blue-300 to-blue-400',
    };
  if (code <= 82)
    return {
      label: 'Rain Showers',
      icon: <CloudRain className="h-full w-full" />,
      gradient: 'from-blue-500 via-indigo-500 to-indigo-700',
    };
  if (code <= 86)
    return {
      label: 'Snow Showers',
      icon: <CloudSnow className="h-full w-full" />,
      gradient: 'from-slate-300 via-blue-400 to-blue-500',
    };
  return {
    label: 'Thunderstorm',
    icon: <CloudLightning className="h-full w-full" />,
    gradient: 'from-slate-600 via-slate-700 to-slate-800',
  };
}

function getWindDirection(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8] ?? 'N';
}

interface Suitability {
  label: string;
  color: string;
  bg: string;
  dot: string;
  tip: string;
}

function getFarmSuitability(weather: WeatherData['current']): Suitability {
  if (weather.weatherCode >= 95)
    return {
      label: 'Not Suitable',
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-500',
      tip: 'Thunderstorm — avoid all field operations',
    };
  if (weather.weatherCode >= 61 || weather.precipitation > 2)
    return {
      label: 'Poor',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
      dot: 'bg-orange-500',
      tip: 'Heavy rain — delay spraying & harvest',
    };
  if (weather.windSpeed > 30)
    return {
      label: 'Caution',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
      dot: 'bg-yellow-500',
      tip: 'High winds — avoid aerial spraying',
    };
  if (weather.weatherCode === 0 || weather.weatherCode <= 3)
    return {
      label: 'Excellent',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-500',
      tip: 'Perfect for all field work',
    };
  return {
    label: 'Good',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    dot: 'bg-green-500',
    tip: 'Suitable for most farm activities',
  };
}

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tom.';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

interface WeatherWidgetProps {
  weatherData: WeatherData;
  onRefresh: () => void;
  loading?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weatherData,
  onRefresh,
  loading = false,
}) => {
  const { current, daily } = weatherData;
  const condition = getWeatherCondition(current.weatherCode);
  const suitability = getFarmSuitability(current);

  return (
    <div className="card-elevated overflow-hidden animate-in">
      {/* Gradient header */}
      <div
        className={`bg-gradient-to-br ${condition.gradient} p-5 text-white relative overflow-hidden`}
      >
        {/* Decorative background icon */}
        <div className="absolute -top-4 -right-4 opacity-10 w-36 h-36 pointer-events-none">
          {condition.icon}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-3">
              Live Weather
            </p>
            <div className="flex items-end space-x-1">
              <span className="text-6xl font-bold leading-none">
                {Math.round(current.temperature)}
              </span>
              <span className="text-3xl font-light text-white/80 mb-1">°C</span>
            </div>
            <p className="text-white font-semibold text-lg mt-1">
              {condition.label}
            </p>
            <p className="text-white/70 text-sm">
              Feels like {Math.round(current.apparentTemperature)}°C
            </p>
          </div>

          <div className="flex flex-col items-end space-y-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh weather"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <div className="h-12 w-12 text-white/80">{condition.icon}</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Farm Suitability */}
        <div className={`rounded-xl p-3 border ${suitability.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-0.5">
                Farm Activity
              </p>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full animate-pulse ${suitability.dot}`}
                />
                <p className={`font-bold text-base ${suitability.color}`}>
                  {suitability.label}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 text-right max-w-[130px] leading-snug">
              {suitability.tip}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Humidity */}
          <div className="bg-sky-50 rounded-xl p-3 flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 leading-none mb-0.5">
                Humidity
              </p>
              <p className="font-bold text-neutral-800 text-sm">
                {current.humidity}%
              </p>
            </div>
          </div>

          {/* Wind */}
          <div className="bg-teal-50 rounded-xl p-3 flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wind className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 leading-none mb-0.5">
                Wind
              </p>
              <p className="font-bold text-neutral-800 text-sm">
                {Math.round(current.windSpeed)}{' '}
                <span className="text-xs font-normal text-neutral-500">
                  km/h {getWindDirection(current.windDirection)}
                </span>
              </p>
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-violet-50 rounded-xl p-3 flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 leading-none mb-0.5">
                Pressure
              </p>
              <p className="font-bold text-neutral-800 text-sm">
                {Math.round(current.surfacePressure)}{' '}
                <span className="text-xs font-normal text-neutral-500">
                  hPa
                </span>
              </p>
            </div>
          </div>

          {/* UV Index */}
          <div className="bg-amber-50 rounded-xl p-3 flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sun className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 leading-none mb-0.5">
                UV Index
              </p>
              <p className="font-bold text-neutral-800 text-sm">
                {current.uvIndex}{' '}
                <span
                  className={`text-xs font-semibold ${
                    current.uvIndex >= 8
                      ? 'text-red-500'
                      : current.uvIndex >= 5
                        ? 'text-orange-500'
                        : 'text-green-500'
                  }`}
                >
                  {current.uvIndex >= 8
                    ? 'High'
                    : current.uvIndex >= 5
                      ? 'Mod.'
                      : 'Low'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Precipitation bar */}
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Umbrella className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-neutral-700">
                Precipitation
              </span>
            </div>
            <span className="text-sm font-bold text-blue-700">
              {current.precipitation} mm
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (current.precipitation / 20) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-blue-500 mt-1.5">
            {current.precipitation < 0.1
              ? 'No precipitation'
              : current.precipitation < 5
                ? 'Light rain'
                : 'Moderate to heavy rain'}
          </p>
        </div>

        {/* 7-day forecast */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            7-Day Forecast
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {daily.map((day, i) => {
              const info = getWeatherCondition(day.weatherCode);
              const isToday = i === 0;
              return (
                <div
                  key={day.date}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${
                    isToday
                      ? 'bg-gradient-to-b from-primary-50 to-primary-100 border border-primary-200'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-1.5 ${isToday ? 'text-primary-700' : 'text-neutral-500'}`}
                  >
                    {getDayLabel(day.date, i)}
                  </p>
                  <div className="h-4 w-4 text-neutral-600 mb-1">{info.icon}</div>
                  {day.precipitationProbability > 20 && (
                    <p className="text-xs text-blue-500 font-semibold mb-0.5">
                      {day.precipitationProbability}%
                    </p>
                  )}
                  {day.precipitationProbability <= 20 && (
                    <div className="mb-0.5 h-4" />
                  )}
                  <p className="text-xs font-bold text-neutral-800">
                    {Math.round(day.tempMax)}°
                  </p>
                  <p className="text-xs text-neutral-400">
                    {Math.round(day.tempMin)}°
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-neutral-400">
          Powered by{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-600"
          >
            Open-Meteo
          </a>
        </p>
      </div>
    </div>
  );
};
