import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Sprout,
  RefreshCw,
  Sparkles,
  Calendar,
  Clock3,
  Wind,
  Droplets,
  Sun,
  History,
  CloudOff,
  Radio,
  Thermometer,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import type {
  WeatherCalendarData,
  DayWeather,
  DayAvailability,
} from '../hooks/useWeatherCalendar';

function weatherEmoji(code: number): string {
  if (code === -1) return '?';
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 67) return '🌨️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '❄️';
  return '⛈️';
}

function weatherLabel(code: number): string {
  if (code === -1) return 'No data yet';
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code <= 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 67) return 'Freezing Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  return 'Thunderstorm';
}

interface RainInfo {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  barColor: string;
  advice: string;
  cellTint: string;
}

function getRainInfo(precipMm: number, precipProb: number | null): RainInfo {
  const prob = precipProb ?? 0;
  const intensity =
    precipMm > 20
      ? 'heavy'
      : precipMm > 8
        ? 'moderate'
        : precipMm > 1
          ? 'light'
          : prob >= 70
            ? 'moderate'
            : prob >= 40
              ? 'light'
              : 'dry';

  const map: Record<string, RainInfo> = {
    heavy: {
      label: 'Heavy Rain',
      emoji: '🌧️',
      color: 'text-blue-800',
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      barColor: '#1d4ed8',
      advice: 'Avoid field work. Risk of soil erosion.',
      cellTint: 'bg-blue-200/60',
    },
    moderate: {
      label: 'Moderate Rain',
      emoji: '🌦️',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      barColor: '#3b82f6',
      advice: 'Delay spraying. Check drainage.',
      cellTint: 'bg-blue-100/50',
    },
    light: {
      label: 'Light Rain',
      emoji: '🌂',
      color: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      barColor: '#38bdf8',
      advice: 'Light irrigation may not be needed.',
      cellTint: 'bg-sky-100/40',
    },
    dry: {
      label: 'Dry Day',
      emoji: '☀️',
      color: 'text-neutral-600',
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      barColor: '#d1d5db',
      advice: 'Consider irrigation if soil moisture is low.',
      cellTint: '',
    },
  };

  return (map[intensity] ?? map['dry']) as RainInfo;
}

function conditionGradient(code: number): string {
  if (code === 0) return 'from-amber-400 to-orange-500';
  if (code <= 2) return 'from-sky-400 to-blue-500';
  if (code <= 3) return 'from-slate-400 to-slate-500';
  if (code <= 48) return 'from-slate-300 to-slate-400';
  if (code <= 65) return 'from-blue-500 to-indigo-600';
  if (code <= 77) return 'from-slate-300 to-blue-300';
  return 'from-slate-600 to-slate-800';
}

interface Suitability {
  label: string;
  color: string;
  bg: string;
  cellBg: string;
  dot: string;
}

function getSuitability(day: DayWeather): Suitability {
  if (day.availability === 'unavailable') {
    return {
      label: '—',
      color: 'text-neutral-400',
      bg: 'bg-neutral-50 border-neutral-100',
      cellBg: '',
      dot: 'bg-neutral-300',
    };
  }
  if (day.weatherCode >= 95) {
    return {
      label: 'Not Suitable',
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      cellBg: 'bg-red-50/50',
      dot: 'bg-red-500',
    };
  }
  if (day.weatherCode >= 61 || day.precipitationSum > 5) {
    return {
      label: 'Poor',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
      cellBg: 'bg-orange-50/50',
      dot: 'bg-orange-500',
    };
  }
  if (day.windSpeedMax > 35) {
    return {
      label: 'Caution',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
      cellBg: 'bg-yellow-50/40',
      dot: 'bg-yellow-500',
    };
  }
  if (day.weatherCode === 0 || day.weatherCode <= 2) {
    return {
      label: 'Excellent',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      cellBg: 'bg-emerald-50/30',
      dot: 'bg-emerald-500',
    };
  }
  return {
    label: 'Good',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    cellBg: '',
    dot: 'bg-green-500',
  };
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = (startDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(startDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WeatherRangeKey = '7D' | '14D' | '30D';

const WEATHER_RANGE_DAYS: Record<WeatherRangeKey, number> = {
  '7D': 7,
  '14D': 14,
  '30D': 30,
};

const METRIC_CHIP_STYLES = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

function getRiskTone(day: DayWeather): 'low' | 'medium' | 'high' {
  if (day.availability === 'unavailable') return 'low';
  if (
    day.tempMax >= 38 ||
    day.precipitationSum >= 20 ||
    day.windSpeedMax >= 45
  ) {
    return 'high';
  }
  if (
    day.tempMax >= 33 ||
    day.precipitationSum >= 8 ||
    day.windSpeedMax >= 30
  ) {
    return 'medium';
  }
  return 'low';
}

const TempTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-lg text-xs'>
        <p className='font-semibold text-neutral-700 mb-1'>{label}</p>
        <p className='text-orange-600'>
          High: {Math.round(payload[0]?.value ?? 0)}°C
        </p>
        <p className='text-sky-600'>
          Low: {Math.round(payload[1]?.value ?? 0)}°C
        </p>
      </div>
    );
  }
  return null;
};

const RainTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const rain = payload.find(p => p.name === 'rain');
    const prob = payload.find(p => p.name === 'prob');
    return (
      <div className='bg-white border border-blue-200 rounded-xl px-3 py-2 shadow-lg text-xs'>
        <p className='font-semibold text-neutral-700 mb-1'>{label}</p>
        {rain && (
          <p className='text-blue-700 font-medium'>
            💧 {(rain.value ?? 0).toFixed(1)} mm
          </p>
        )}
        {prob && (prob.value ?? 0) > 0 && (
          <p className='text-sky-600'>{Math.round(prob.value ?? 0)}% chance</p>
        )}
      </div>
    );
  }
  return null;
};

const WeatherIntelligenceTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const temp = payload.find(p => p.dataKey === 'tempAvg')?.value;
  const rain = payload.find(p => p.dataKey === 'rain')?.value;
  const wind = payload.find(p => p.dataKey === 'wind')?.value;

  return (
    <div className='rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs shadow-lg'>
      <p className='font-semibold text-neutral-700'>{label}</p>
      {typeof temp === 'number' && (
        <p className='text-orange-700'>Temp: {temp.toFixed(1)} C</p>
      )}
      {typeof rain === 'number' && (
        <p className='text-blue-700'>Rain: {rain.toFixed(1)} mm</p>
      )}
      {typeof wind === 'number' && (
        <p className='text-teal-700'>Wind: {wind.toFixed(0)} km/h</p>
      )}
    </div>
  );
};

interface DayDetailViewProps {
  day: DayWeather;
  allDays: Record<string, DayWeather>;
  onBack: () => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({
  day,
  allDays,
  onBack,
}) => {
  const suitability = getSuitability(day);

  const availBadge: Record<
    DayAvailability,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    historical: {
      icon: <History className='h-3 w-3' />,
      color: 'text-neutral-600 bg-white/30',
      label: 'Historical',
    },
    forecast: {
      icon: <Radio className='h-3 w-3' />,
      color: 'text-white bg-white/30',
      label: 'Forecast',
    },
    unavailable: {
      icon: <CloudOff className='h-3 w-3' />,
      color: 'text-white bg-white/20',
      label: 'Not Available',
    },
  };
  const badge = availBadge[day.availability] ?? availBadge['historical'];

  const contextWindow = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = addDaysStr(day.date, i - 3);
      const d = allDays[dateStr];
      const label = new Date(`${dateStr}T00:00:00`).toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric' }
      );
      const isCurrent = dateStr === day.date;
      return d && d.availability !== 'unavailable'
        ? {
            label,
            high: d.tempMax,
            low: d.tempMin,
            rain: d.precipitationSum,
            prob: d.precipitationProbability ?? 0,
            isCurrent,
          }
        : { label, high: null, low: null, rain: null, prob: null, isCurrent };
    }).filter(d => d.rain !== null);
  }, [day.date, allDays]);

  const rainInfo = getRainInfo(
    day.precipitationSum,
    day.precipitationProbability
  );
  const uvPercent = Math.min(100, (day.uvIndexMax / 12) * 100);
  const uvColor =
    day.uvIndexMax >= 8
      ? '#ef4444'
      : day.uvIndexMax >= 5
        ? '#f97316'
        : '#22c55e';
  const radialData = [{ value: uvPercent, fill: uvColor }];

  if (day.availability === 'unavailable') {
    return (
      <div className='overflow-hidden animate-in'>
        <div className='flex items-center space-x-2 pb-3 border-b border-neutral-100'>
          <button
            onClick={onBack}
            className='p-1 rounded-md hover:bg-neutral-100 transition-colors'
          >
            <ArrowLeft className='h-3.5 w-3.5 text-neutral-600' />
          </button>
          <span className='text-xs font-semibold text-neutral-700'>
            Back to Calendar
          </span>
        </div>
        <div className='py-8 text-center'>
          <div className='text-4xl mb-3'>🔮</div>
          <p className='text-sm font-semibold text-neutral-700 mb-1'>
            {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className='text-xs text-neutral-500'>
            Forecast not yet available.
          </p>
          <p className='text-[10px] text-neutral-400 mt-1'>
            Up to 16 days ahead supported.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='overflow-hidden animate-in'>
      <div className='flex items-center space-x-2 pb-2 mb-3 border-b border-neutral-100'>
        <button
          onClick={onBack}
          className='flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors'
        >
          <ArrowLeft className='h-3.5 w-3.5' />
          <span>Back</span>
        </button>
      </div>

      <div
        className={`bg-gradient-to-br ${conditionGradient(day.weatherCode)} px-3 py-3 text-white rounded-xl`}
      >
        <div className='flex items-start justify-between'>
          <div className='min-w-0 flex-1'>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color} mb-1`}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>
            <p className='text-white/80 text-[10px]'>
              {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className='flex items-end gap-1'>
              <span className='text-3xl font-bold leading-none'>
                {Math.round(day.tempMax)}°
              </span>
              <span className='text-lg font-light text-white/70 mb-0.5'>
                / {Math.round(day.tempMin)}°
              </span>
            </div>
            <p className='text-white font-semibold text-sm mt-0.5'>
              {weatherLabel(day.weatherCode)}
            </p>
          </div>
          <span className='text-4xl leading-none flex-shrink-0'>
            {weatherEmoji(day.weatherCode)}
          </span>
        </div>

        <div className='mt-2 flex items-center gap-1.5 bg-white/20 rounded-lg px-2 py-1.5 backdrop-blur-sm'>
          <div
            className={`h-1.5 w-1.5 rounded-full animate-pulse ${suitability.dot}`}
          />
          <span className='text-xs font-semibold text-white'>
            {suitability.label}
          </span>
        </div>
      </div>

      <div className='mt-3 space-y-3'>
        <div
          className={`rounded-xl border ${rainInfo.border} ${rainInfo.bg} p-3`}
        >
          <div className='flex items-start justify-between'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1 mb-0.5'>
                <Droplets className={`h-3.5 w-3.5 ${rainInfo.color}`} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${rainInfo.color}`}
                >
                  Rain
                </span>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='text-2xl font-bold text-neutral-900'>
                  {day.precipitationSum.toFixed(1)}
                </span>
                <span className='text-xs font-medium text-neutral-500'>mm</span>
              </div>
              {day.precipitationProbability !== null && (
                <div className='mt-1'>
                  <div className='flex items-center justify-between mb-0.5'>
                    <span className='text-[10px] text-neutral-500'>
                      Probability
                    </span>
                    <span className={`text-[10px] font-bold ${rainInfo.color}`}>
                      {day.precipitationProbability}%
                    </span>
                  </div>
                  <div className='w-full bg-white/60 rounded-full h-1.5 overflow-hidden'>
                    <div
                      className='h-1.5 rounded-full transition-all'
                      style={{
                        width: `${day.precipitationProbability}%`,
                        backgroundColor: rainInfo.barColor,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <span className='text-2xl leading-none flex-shrink-0 ml-2'>
              {rainInfo.emoji}
            </span>
          </div>
          <p className='text-[10px] text-neutral-500 italic mt-1.5'>
            {rainInfo.advice}
          </p>
        </div>

        {contextWindow.length >= 2 && (
          <div>
            <div className='flex items-center gap-1 mb-2'>
              <Droplets className='h-3.5 w-3.5 text-blue-500' />
              <h4 className='text-xs font-semibold text-neutral-800'>
                7-Day Rain
              </h4>
            </div>
            <ResponsiveContainer width='100%' height={100}>
              <BarChart
                data={contextWindow}
                margin={{ top: 4, right: 2, left: -24, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#e0f2fe'
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  unit='mm'
                />
                <Tooltip content={<RainTooltip />} />
                <ReferenceLine
                  y={5}
                  stroke='#f97316'
                  strokeDasharray='3 3'
                  strokeWidth={1}
                />
                <Bar dataKey='rain' name='rain' radius={[3, 3, 0, 0]}>
                  {contextWindow.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isCurrent
                          ? '#1d4ed8'
                          : entry.rain !== null && (entry.rain as number) > 5
                            ? '#3b82f6'
                            : '#bfdbfe'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {contextWindow.some(d => (d.prob ?? 0) > 0) && (
              <>
                <p className='text-[10px] font-semibold text-sky-600 mt-2 mb-1'>
                  Rain Probability
                </p>
                <ResponsiveContainer width='100%' height={60}>
                  <AreaChart
                    data={contextWindow}
                    margin={{ top: 2, right: 2, left: -24, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id='probGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop
                          offset='5%'
                          stopColor='#38bdf8'
                          stopOpacity={0.4}
                        />
                        <stop
                          offset='95%'
                          stopColor='#38bdf8'
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey='label'
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      unit='%'
                    />
                    <Tooltip content={<RainTooltip />} />
                    <Area
                      type='monotone'
                      dataKey='prob'
                      name='prob'
                      stroke='#0ea5e9'
                      strokeWidth={1.5}
                      fill='url(#probGrad)'
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      dot={(props: any) => {
                        const { cx = 0, cy = 0, payload } = props;
                        return (payload as { isCurrent: boolean }).isCurrent ? (
                          <circle
                            key={`pd-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill='#0ea5e9'
                            stroke='#fff'
                            strokeWidth={2}
                          />
                        ) : (
                          <circle
                            key={`p-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={1.5}
                            fill='#0ea5e9'
                            stroke='none'
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-teal-50 rounded-lg p-2.5'>
            <div className='flex items-center gap-1 mb-0.5'>
              <Wind className='h-3 w-3 text-teal-500' />
              <p className='text-[10px] text-neutral-500'>Wind</p>
            </div>
            <p className='font-bold text-neutral-800 text-sm'>
              {Math.round(day.windSpeedMax)}{' '}
              <span className='text-[10px] font-normal'>km/h</span>
            </p>
            <p className='text-[10px] text-teal-600'>
              {day.windSpeedMax > 35
                ? 'Strong'
                : day.windSpeedMax > 20
                  ? 'Moderate'
                  : 'Light'}
            </p>
          </div>
          <div className='bg-amber-50 rounded-lg p-2.5'>
            <div className='flex items-center gap-1 mb-0.5'>
              <Sun className='h-3 w-3 text-amber-500' />
              <p className='text-[10px] text-neutral-500'>UV Index</p>
            </div>
            <p className='font-bold text-neutral-800 text-sm'>
              {day.uvIndexMax.toFixed(1)}
            </p>
            <p
              className={`text-[10px] ${day.uvIndexMax >= 8 ? 'text-red-500' : day.uvIndexMax >= 5 ? 'text-orange-500' : 'text-green-600'}`}
            >
              {day.uvIndexMax >= 8
                ? 'Very High'
                : day.uvIndexMax >= 5
                  ? 'Moderate'
                  : 'Low'}
            </p>
          </div>
        </div>

        {contextWindow.length >= 3 && (
          <div>
            <div className='flex items-center gap-1 mb-2'>
              <Thermometer className='h-3.5 w-3.5 text-orange-500' />
              <h4 className='text-xs font-semibold text-neutral-800'>
                Temperature
              </h4>
            </div>
            <ResponsiveContainer width='100%' height={100}>
              <AreaChart
                data={contextWindow}
                margin={{ top: 4, right: 2, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id='highGradCal' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#f97316' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#f97316' stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id='lowGradCal' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#38bdf8' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#38bdf8' stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#f0f0f0'
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  unit='°'
                />
                <Tooltip content={<TempTooltip />} />
                <Area
                  type='monotone'
                  dataKey='high'
                  stroke='#f97316'
                  strokeWidth={1.5}
                  fill='url(#highGradCal)'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={(props: any) => {
                    const { cx = 0, cy = 0, payload } = props;
                    return (payload as { isCurrent: boolean }).isCurrent ? (
                      <circle
                        key={`hd-${cx}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill='#f97316'
                        stroke='#fff'
                        strokeWidth={2}
                      />
                    ) : (
                      <circle
                        key={`h-${cx}`}
                        cx={cx}
                        cy={cy}
                        r={2}
                        fill='#f97316'
                        stroke='none'
                      />
                    );
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='low'
                  stroke='#38bdf8'
                  strokeWidth={1.5}
                  fill='url(#lowGradCal)'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={(props: any) => {
                    const { cx = 0, cy = 0, payload } = props;
                    return (payload as { isCurrent: boolean }).isCurrent ? (
                      <circle
                        key={`ld-${cx}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill='#38bdf8'
                        stroke='#fff'
                        strokeWidth={2}
                      />
                    ) : (
                      <circle
                        key={`l-${cx}`}
                        cx={cx}
                        cy={cy}
                        r={2}
                        fill='#38bdf8'
                        stroke='none'
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className='flex items-center justify-center gap-3 mt-1'>
              <span className='flex items-center gap-1 text-[10px] text-neutral-500'>
                <span className='inline-block w-2.5 h-0.5 bg-orange-500 rounded' />
                High
              </span>
              <span className='flex items-center gap-1 text-[10px] text-neutral-500'>
                <span className='inline-block w-2.5 h-0.5 bg-sky-400 rounded' />
                Low
              </span>
            </div>
          </div>
        )}

        <div className='grid grid-cols-2 gap-2'>
          <div className='bg-amber-50/60 rounded-xl p-2.5'>
            <p className='text-[10px] font-semibold text-neutral-600 mb-0.5 text-center'>
              UV Index
            </p>
            <div className='relative'>
              <ResponsiveContainer width='100%' height={70}>
                <RadialBarChart
                  innerRadius='60%'
                  outerRadius='100%'
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey='value'
                    cornerRadius={6}
                    background={{ fill: '#fef3c7' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className='absolute inset-0 flex flex-col items-center justify-end pb-1'>
                <p className='text-base font-bold text-neutral-800'>
                  {day.uvIndexMax.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-teal-50/60 rounded-xl p-2.5 flex flex-col justify-between'>
            <div className='flex items-center gap-1'>
              <Wind className='h-3.5 w-3.5 text-teal-600' />
              <p className='text-[10px] font-semibold text-neutral-600'>Wind</p>
            </div>
            <div>
              <p className='text-xl font-bold text-neutral-800'>
                {Math.round(day.windSpeedMax)}
                <span className='text-[10px] font-normal text-neutral-500'>
                  {' '}
                  km/h
                </span>
              </p>
              <div className='w-full bg-teal-100 rounded-full h-1.5 mt-1'>
                <div
                  className='bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full transition-all'
                  style={{
                    width: `${Math.min(100, (day.windSpeedMax / 80) * 100)}%`,
                  }}
                />
              </div>
              <div className='flex justify-between text-[9px] text-neutral-400 mt-0.5'>
                <span>Calm</span>
                <span>Storm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FarmWeatherCalendarProps {
  calendarData: WeatherCalendarData;
  onRefresh: () => void;
  loading?: boolean;
}

export const FarmWeatherCalendar: React.FC<FarmWeatherCalendarProps> = ({
  calendarData,
  onRefresh,
  loading = false,
}) => {
  const { days, plantingDate, harvestDate } = calendarData;

  const plantDate = new Date(`${plantingDate}T00:00:00`);
  const harvestDt = new Date(`${harvestDate}T00:00:00`);
  const todayStr = toDateStr(new Date());

  const [viewYear, setViewYear] = useState(plantDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(plantDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<
    'heat' | 'rain' | 'spray' | null
  >(null);
  const [selectedWeatherRange, setSelectedWeatherRange] =
    useState<WeatherRangeKey>('14D');
  const [weatherChartMode, setWeatherChartMode] = useState<
    'combined' | 'temp' | 'rain'
  >('combined');
  const [showMoreWeatherInfo, setShowMoreWeatherInfo] = useState(false);

  const plantYM = { y: plantDate.getFullYear(), m: plantDate.getMonth() };
  const harvestYM = { y: harvestDt.getFullYear(), m: harvestDt.getMonth() };

  const canGoPrev =
    viewYear > plantYM.y || (viewYear === plantYM.y && viewMonth > plantYM.m);
  const canGoNext =
    viewYear < harvestYM.y ||
    (viewYear === harvestYM.y && viewMonth < harvestYM.m);

  function prevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }

  function jumpTo(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function jumpToToday() {
    const today = new Date();
    const start = new Date(`${plantingDate}T00:00:00`);
    const end = new Date(`${harvestDate}T00:00:00`);
    if (today >= start && today <= end) {
      jumpTo(toDateStr(today));
    }
  }

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const availableDays = useMemo(
    () =>
      Object.values(days)
        .filter(d => d.availability !== 'unavailable')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [days]
  );

  const recentWeek = availableDays.slice(-7);
  const todayData = days[todayStr] ?? availableDays[availableDays.length - 1];

  const weekSummary = useMemo(() => {
    if (recentWeek.length === 0) {
      return {
        avgTemp: 0,
        totalRain: 0,
        avgWind: 0,
        riskLevel: 'Low' as 'Low' | 'Moderate' | 'High',
      };
    }

    const avgTemp =
      recentWeek.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) /
      recentWeek.length;
    const totalRain = recentWeek.reduce(
      (sum, d) => sum + d.precipitationSum,
      0
    );
    const avgWind =
      recentWeek.reduce((sum, d) => sum + d.windSpeedMax, 0) /
      recentWeek.length;

    const score =
      (avgTemp > 34 ? 1 : 0) +
      (totalRain > 60 ? 1 : 0) +
      (avgWind > 32 ? 1 : 0);

    const riskLevel = score >= 2 ? 'High' : score === 1 ? 'Moderate' : 'Low';

    return { avgTemp, totalRain, avgWind, riskLevel };
  }, [recentWeek]);

  const weeklyAlert = useMemo(() => {
    if (recentWeek.some(d => d.tempMax >= 40)) {
      return 'Heat-wave conditions detected in recent days. Prefer early irrigation windows.';
    }
    if (recentWeek.some(d => d.precipitationSum >= 30)) {
      return 'Heavy rain event detected. Review drainage and postpone non-essential irrigation.';
    }
    if (recentWeek.some(d => d.windSpeedMax >= 45)) {
      return 'High wind event detected. Avoid spraying during gust periods.';
    }
    return null;
  }, [recentWeek]);

  const forecastStrip = useMemo(() => {
    const forecastOnly = availableDays.filter(
      d => d.availability === 'forecast'
    );
    const source =
      forecastOnly.length >= 3 ? forecastOnly : availableDays.slice(-3);
    return source.slice(0, 3);
  }, [availableDays]);

  const weatherIntelligenceData = useMemo(() => {
    if (availableDays.length === 0) return [];

    return availableDays.map(d => ({
      date: d.date,
      label: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      tempAvg: (d.tempMax + d.tempMin) / 2,
      rain: d.precipitationSum,
      wind: d.windSpeedMax,
    }));
  }, [availableDays]);

  const filteredWeatherIntelligenceData = useMemo(() => {
    const take = WEATHER_RANGE_DAYS[selectedWeatherRange];
    return weatherIntelligenceData.slice(-take);
  }, [weatherIntelligenceData, selectedWeatherRange]);

  const monthStats = useMemo(() => {
    const monthDays = Object.values(days).filter(d => {
      const [y, m] = d.date.split('-').map(Number);
      return (
        y === viewYear &&
        m === viewMonth + 1 &&
        d.availability !== 'unavailable'
      );
    });

    if (monthDays.length === 0) return null;

    const goodDays = monthDays.filter(d =>
      ['Excellent', 'Good'].includes(getSuitability(d).label)
    ).length;
    const rainDays = monthDays.filter(d => d.precipitationSum > 1).length;
    const avgMax = Math.round(
      monthDays.reduce((s, d) => s + d.tempMax, 0) / monthDays.length
    );
    const totalRain = Math.round(
      monthDays.reduce((s, d) => s + d.precipitationSum, 0)
    );
    const heavyDays = monthDays.filter(d => d.precipitationSum > 10).length;

    return { goodDays, rainDays, avgMax, totalRain, heavyDays };
  }, [days, viewYear, viewMonth]);

  const weatherCoverage = useMemo(() => {
    const all = Object.values(days);
    const historical = all.filter(d => d.availability === 'historical').length;
    const forecast = all.filter(d => d.availability === 'forecast').length;
    const unavailable = all.filter(
      d => d.availability === 'unavailable'
    ).length;
    const rainy = all.filter(
      d => d.availability !== 'unavailable' && d.precipitationSum > 1
    ).length;
    const heavyRain = all.filter(
      d => d.availability !== 'unavailable' && d.precipitationSum > 10
    ).length;
    const hotDays = all.filter(
      d => d.availability !== 'unavailable' && d.tempMax >= 35
    ).length;
    return { historical, forecast, unavailable, rainy, heavyRain, hotDays };
  }, [days]);

  const selectedDay = selectedDate ? days[selectedDate] : null;

  if (selectedDate && selectedDay) {
    return (
      <DayDetailView
        day={selectedDay}
        allDays={days}
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  return (
    <div className='animate-in'>
      <div className='relative mb-2 overflow-hidden rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-2 text-white shadow-sm'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/20 blur-2xl animate-pulse' />
        <div className='mb-1.5 flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${weekSummary.riskLevel === 'High' ? 'border-red-200 bg-red-100 text-red-800' : weekSummary.riskLevel === 'Moderate' ? 'border-amber-200 bg-amber-100 text-amber-800' : 'border-emerald-200 bg-emerald-100 text-emerald-800'}`}
              >
                Risk: {weekSummary.riskLevel}
              </span>
              <p className='truncate text-[11px] font-medium text-emerald-50/90'>
                {todayData
                  ? `${Math.round((todayData.tempMax + todayData.tempMin) / 2)} C, ${todayData.precipitationSum.toFixed(1)} mm`
                  : 'No live day data'}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            title='Refresh'
            className='rounded-md border border-white/30 bg-white/15 p-1 text-white transition hover:bg-white/25'
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <div className='grid grid-cols-3 gap-1'>
          <button
            type='button'
            onClick={() =>
              setActiveInsight(prev => (prev === 'heat' ? null : 'heat'))
            }
            className={`rounded-md border px-1.5 py-1 text-left backdrop-blur-sm transition-all ${activeInsight === 'heat' ? 'border-orange-200 bg-orange-100/90 ring-1 ring-orange-200' : 'border-white/25 bg-white/20 hover:bg-white/30'}`}
          >
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1 text-[9px] text-emerald-50/90'>
                <Sun className='h-3 w-3' />
                Heat
              </span>
              <p className='text-[10px] font-semibold text-white'>
                {weekSummary.avgTemp > 34
                  ? 'High'
                  : weekSummary.avgTemp > 30
                    ? 'Moderate'
                    : 'Low'}
              </p>
            </div>
          </button>
          <button
            type='button'
            onClick={() =>
              setActiveInsight(prev => (prev === 'rain' ? null : 'rain'))
            }
            className={`rounded-md border px-1.5 py-1 text-left backdrop-blur-sm transition-all ${activeInsight === 'rain' ? 'border-sky-200 bg-sky-100/90 ring-1 ring-sky-200' : 'border-white/25 bg-white/20 hover:bg-white/30'}`}
          >
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1 text-[9px] text-emerald-50/90'>
                <Droplets className='h-3 w-3' />
                Rain
              </span>
              <p className='text-[10px] font-semibold text-white'>
                {weekSummary.totalRain > 60
                  ? 'High'
                  : weekSummary.totalRain > 28
                    ? 'Moderate'
                    : 'Low'}
              </p>
            </div>
          </button>
          <button
            type='button'
            onClick={() =>
              setActiveInsight(prev => (prev === 'spray' ? null : 'spray'))
            }
            className={`rounded-md border px-1.5 py-1 text-left backdrop-blur-sm transition-all ${activeInsight === 'spray' ? 'border-emerald-200 bg-emerald-100/90 ring-1 ring-emerald-200' : 'border-white/25 bg-white/20 hover:bg-white/30'}`}
          >
            <div className='flex items-center justify-between'>
              <span className='flex items-center gap-1 text-[9px] text-emerald-50/90'>
                <Wind className='h-3 w-3' />
                Spray
              </span>
              <p className='text-[10px] font-semibold text-white'>
                {weekSummary.avgWind > 32
                  ? 'Poor'
                  : weekSummary.totalRain > 40
                    ? 'Caution'
                    : 'Good'}
              </p>
            </div>
          </button>
        </div>
        {activeInsight && (
          <p className='mt-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] text-emerald-50/95'>
            {activeInsight === 'heat'
              ? weekSummary.avgTemp > 34
                ? 'High heat load this week. Prefer early morning irrigation and monitor canopy wilting zones.'
                : 'Heat is manageable. Keep current irrigation timing and continue routine crop observation.'
              : activeInsight === 'rain'
                ? weekSummary.totalRain > 60
                  ? 'Rain accumulation is high. Delay irrigation and inspect drainage in low-lying areas.'
                  : 'Rain load is moderate/low. Maintain drainage checks and watch for sudden showers.'
                : weekSummary.avgWind > 32
                  ? 'Spray conditions are poor due to wind. Wait for calmer windows to reduce spray drift.'
                  : 'Spray window is acceptable. Proceed during low-wind hours for better coverage.'}
          </p>
        )}
        {weeklyAlert && (
          <div className='mt-1 rounded-md border border-red-200/70 bg-red-100/90 p-1.5'>
            <div className='flex items-start gap-1.5'>
              <AlertTriangle className='mt-0.5 h-3.5 w-3.5 text-red-700' />
              <p className='text-[10px] text-red-900'>{weeklyAlert}</p>
            </div>
          </div>
        )}

        <div className='mt-2 rounded-lg border border-white/25 bg-white/10 p-2 backdrop-blur-sm'>
          <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
            <p className='text-[11px] font-medium text-emerald-50'>
              {new Date(`${plantingDate}T00:00:00`).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                }
              )}
              {' → '}
              {new Date(`${harvestDate}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className='inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-emerald-50'>
              Tap a date for details
            </div>
          </div>

          <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center'>
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className='rounded-md p-1 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30'
              >
                <ChevronLeft className='h-3.5 w-3.5 text-emerald-50' />
              </button>
              <h4 className='min-w-[90px] text-center text-xs font-bold text-white'>
                {MONTHS[viewMonth]} {viewYear}
              </h4>
              <button
                onClick={nextMonth}
                disabled={!canGoNext}
                className='rounded-md p-1 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30'
              >
                <ChevronRight className='h-3.5 w-3.5 text-emerald-50' />
              </button>
            </div>
            <div className='flex min-w-0 flex-wrap items-center justify-end gap-1'>
              <button
                onClick={() => jumpTo(plantingDate)}
                className='flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 hover:bg-emerald-50'
                title='Jump to sowing date'
              >
                <Sprout className='h-2.5 w-2.5' />
                <span>Sow</span>
              </button>
              <button
                onClick={() => jumpTo(harvestDate)}
                className='flex items-center gap-0.5 rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-50'
                title='Jump to harvest date'
              >
                <span className='text-[9px]'>🌾</span>
                <span>Harvest</span>
              </button>
              <button
                onClick={jumpToToday}
                className='rounded-md border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800 hover:bg-sky-50'
                title='Jump to today'
              >
                Today
              </button>
            </div>
          </div>

          <div className='mb-1 grid grid-cols-7'>
            {DOW_SHORT.map(d => (
              <div
                key={d}
                className='py-0.5 text-center text-[9px] font-semibold text-emerald-100/90'
              >
                {d}
              </div>
            ))}
          </div>

          <div className='overflow-hidden rounded-lg border border-white/20 bg-white/10'>
            {grid.map((row, ri) => (
              <div key={ri} className='grid grid-cols-7'>
                {row.map((dateStr, ci) => {
                  if (!dateStr) {
                    return (
                      <div
                        key={ci}
                        className={`h-10 border-b border-r border-white/10 ${ri === grid.length - 1 ? 'border-b-0' : ''} ${ci === 6 ? 'border-r-0' : ''}`}
                      />
                    );
                  }

                  const dt = new Date(`${dateStr}T00:00:00`);
                  const inRange = dt >= plantDate && dt <= harvestDt;
                  const dayData = days[dateStr];
                  const isToday = dateStr === todayStr;
                  const isPlanting = dateStr === plantingDate;
                  const isHarvest = dateStr === harvestDate;
                  const riskTone =
                    dayData && dayData.availability !== 'unavailable'
                      ? getRiskTone(dayData)
                      : 'low';

                  let cellBg = '';
                  if (!inRange) cellBg = 'bg-emerald-950/40';
                  else if (riskTone === 'high') cellBg = 'bg-red-300/25';
                  else if (riskTone === 'medium') cellBg = 'bg-amber-200/20';
                  else cellBg = 'bg-emerald-200/20';

                  return (
                    <button
                      key={dateStr}
                      disabled={!inRange}
                      onClick={() => setSelectedDate(dateStr)}
                      title={
                        dayData && dayData.availability !== 'unavailable'
                          ? `${new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} | ${weatherLabel(dayData.weatherCode)} | ${Math.round(dayData.tempMax)}°/${Math.round(dayData.tempMin)}° | ${dayData.precipitationSum.toFixed(1)}mm rain | ${getRiskTone(dayData)} risk`
                          : new Date(`${dateStr}T00:00:00`).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                      }
                      className={`
                        relative h-11 transform-gpu overflow-hidden border-b border-r border-white/10 pt-px transition-all duration-150
                        flex flex-col items-center justify-start
                        ${ri === grid.length - 1 ? 'border-b-0' : ''}
                        ${ci === 6 ? 'border-r-0' : ''}
                        ${cellBg}
                        ${inRange ? 'cursor-pointer hover:bg-emerald-100/25 hover:-translate-y-[1px] active:translate-y-0 active:bg-emerald-100/35' : ''}
                      `}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-semibold
                        ${isToday ? 'bg-emerald-100 text-emerald-900' : ''}
                        ${!inRange ? 'text-emerald-100/40' : !isToday ? 'text-emerald-50' : ''}
                      `}
                      >
                        {dt.getDate()}
                      </span>
                      {isPlanting && (
                        <span className='absolute left-0 top-0 text-[6px] leading-none'>
                          🌱
                        </span>
                      )}
                      {isHarvest && (
                        <span className='absolute right-0 top-0 text-[6px] leading-none'>
                          🌾
                        </span>
                      )}
                      {inRange &&
                        dayData &&
                        dayData.availability !== 'unavailable' && (
                          <span
                            className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ${riskTone === 'high' ? 'bg-red-400' : riskTone === 'medium' ? 'bg-amber-400' : 'bg-emerald-300'}`}
                          />
                        )}
                      {inRange &&
                        dayData &&
                        (dayData.availability === 'unavailable' ? (
                          <span className='text-[9px] leading-none'>🔮</span>
                        ) : (
                          <>
                            <span className='text-[9px] leading-none'>
                              {weatherEmoji(dayData.weatherCode)}
                            </span>
                            <span className='text-[7px] font-bold leading-none text-emerald-50/90'>
                              {Math.round(dayData.tempMax)}°
                            </span>
                          </>
                        ))}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mb-2 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-2 shadow-sm'>
        <div className='mb-1.5 flex items-center justify-between'>
          <h4 className='text-xs font-semibold text-emerald-950'>
            Weather Intelligence
          </h4>
          <div className='inline-flex rounded-md border border-emerald-200 bg-white p-0.5'>
            {(['7D', '14D', '30D'] as WeatherRangeKey[]).map(range => (
              <button
                key={range}
                type='button'
                onClick={() => setSelectedWeatherRange(range)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${selectedWeatherRange === range ? 'bg-emerald-600 text-white' : 'text-neutral-600 hover:bg-emerald-50'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-1.5 inline-flex rounded-md border border-emerald-200 bg-white p-0.5'>
          <button
            type='button'
            onClick={() => setWeatherChartMode('combined')}
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${weatherChartMode === 'combined' ? 'bg-emerald-900 text-white' : 'text-neutral-600 hover:bg-emerald-50'}`}
          >
            Combined
          </button>
          <button
            type='button'
            onClick={() => setWeatherChartMode('temp')}
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${weatherChartMode === 'temp' ? 'bg-emerald-900 text-white' : 'text-neutral-600 hover:bg-emerald-50'}`}
          >
            Temp
          </button>
          <button
            type='button'
            onClick={() => setWeatherChartMode('rain')}
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${weatherChartMode === 'rain' ? 'bg-emerald-900 text-white' : 'text-neutral-600 hover:bg-emerald-50'}`}
          >
            Rain
          </button>
        </div>

        {filteredWeatherIntelligenceData.length > 0 ? (
          <ResponsiveContainer width='100%' height={128}>
            {weatherChartMode === 'combined' ? (
              <ComposedChart
                data={filteredWeatherIntelligenceData}
                margin={{ top: 4, right: 6, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#bbf7d0'
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={14}
                />
                <YAxis
                  yAxisId='left'
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<WeatherIntelligenceTooltip />} />
                <Bar
                  yAxisId='right'
                  dataKey='rain'
                  fill='#34d399'
                  radius={[3, 3, 0, 0]}
                  maxBarSize={14}
                />
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='tempAvg'
                  stroke='#059669'
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 3.5 }}
                />
              </ComposedChart>
            ) : weatherChartMode === 'temp' ? (
              <AreaChart
                data={filteredWeatherIntelligenceData}
                margin={{ top: 4, right: 6, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id='weatherTempFill'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.35} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#bbf7d0'
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={14}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<WeatherIntelligenceTooltip />} />
                <Area
                  type='monotone'
                  dataKey='tempAvg'
                  stroke='#059669'
                  strokeWidth={2}
                  fill='url(#weatherTempFill)'
                />
              </AreaChart>
            ) : (
              <BarChart
                data={filteredWeatherIntelligenceData}
                margin={{ top: 4, right: 6, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#bbf7d0'
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={14}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<WeatherIntelligenceTooltip />} />
                <Bar
                  dataKey='rain'
                  fill='#34d399'
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-center text-[10px] text-neutral-500'>
            Not enough weather points for visualization.
          </div>
        )}

        <div className='mt-1.5 flex flex-wrap gap-1'>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${weekSummary.avgTemp > 34 ? METRIC_CHIP_STYLES.high : weekSummary.avgTemp > 30 ? METRIC_CHIP_STYLES.medium : METRIC_CHIP_STYLES.low}`}
          >
            Avg Temp {weekSummary.avgTemp.toFixed(1)} C
          </span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${weekSummary.totalRain > 60 ? METRIC_CHIP_STYLES.high : weekSummary.totalRain > 28 ? METRIC_CHIP_STYLES.medium : METRIC_CHIP_STYLES.low}`}
          >
            Rain {weekSummary.totalRain.toFixed(1)} mm
          </span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${weekSummary.avgWind > 32 ? METRIC_CHIP_STYLES.high : weekSummary.avgWind > 22 ? METRIC_CHIP_STYLES.medium : METRIC_CHIP_STYLES.low}`}
          >
            Wind {weekSummary.avgWind.toFixed(0)} km/h
          </span>
        </div>
      </div>

      <div className='mb-2 rounded-lg border border-neutral-200 bg-white p-1.5'>
        <div className='mb-1 flex items-center justify-between'>
          <p className='text-[10px] font-semibold text-neutral-700'>
            3-Day Forecast
          </p>
          <span className='text-[9px] text-neutral-500'>
            Tap day for details
          </span>
        </div>
        <div className='grid grid-cols-3 gap-1.5'>
          {forecastStrip.map(d => (
            <button
              key={d.date}
              type='button'
              onClick={() => {
                jumpTo(d.date);
                setSelectedDate(d.date);
              }}
              className='rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-1 text-left transition hover:bg-neutral-100'
            >
              <p className='text-[9px] font-semibold text-neutral-700'>
                {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
                  weekday: 'short',
                })}
              </p>
              <p className='text-[10px] text-neutral-600'>
                {weatherEmoji(d.weatherCode)}{' '}
                {Math.round((d.tempMax + d.tempMin) / 2)}°
              </p>
              <p className='text-[9px] text-blue-700'>
                {d.precipitationSum.toFixed(1)} mm
              </p>
            </button>
          ))}
        </div>
      </div>

      {!showMoreWeatherInfo ? (
        <div className='relative overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-b from-white to-emerald-50/40 p-3 shadow-sm'>
          <div className='pointer-events-none absolute inset-0 backdrop-blur-[1px]' />
          <div className='pointer-events-none absolute -bottom-10 left-0 right-0 h-28 bg-gradient-to-t from-emerald-300/50 via-emerald-200/25 to-transparent blur-2xl' />

          <div className='relative pb-12'>
            <div className='mb-2 flex items-center gap-1.5'>
              <Sparkles className='h-4 w-4 text-emerald-700' />
              <h4 className='text-sm font-semibold text-neutral-900'>
                More Weather Info
              </h4>
            </div>

            <div className='grid grid-cols-2 gap-2 text-[11px]'>
              <div className='rounded-lg bg-sky-50 p-2'>
                <p className='text-sky-700'>Historical</p>
                <p className='font-semibold text-sky-900'>
                  {weatherCoverage.historical} days
                </p>
              </div>
              <div className='rounded-lg bg-indigo-50 p-2'>
                <p className='text-indigo-700'>Forecast</p>
                <p className='font-semibold text-indigo-900'>
                  {weatherCoverage.forecast} days
                </p>
              </div>
            </div>

            <div className='mt-2 space-y-1 text-[10px] text-neutral-700'>
              <p className='inline-flex items-center gap-1'>
                <Clock3 className='h-3 w-3' />
                Rain days:{' '}
                <span className='font-semibold'>{weatherCoverage.rainy}</span>
              </p>
              <p>
                Heavy rain:{' '}
                <span className='font-semibold'>
                  {weatherCoverage.heavyRain} days
                </span>
              </p>
              <div className='h-1.5 overflow-hidden rounded-full bg-neutral-100'>
                <div
                  className='h-full bg-sky-500 transition-all duration-500'
                  style={{
                    width: `${Math.min(100, (weatherCoverage.rainy / Math.max(1, availableDays.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/95 via-white/80 to-transparent backdrop-blur-[2px]' />
          </div>

          <button
            type='button'
            onClick={() => setShowMoreWeatherInfo(true)}
            className='absolute bottom-2.5 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full border border-emerald-200 bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-400/40 transition-colors hover:bg-emerald-500'
          >
            More info
            <ChevronRight className='ml-1.5 h-4 w-4' />
          </button>
        </div>
      ) : (
        <>
          <div className='flex justify-end -mt-1 mb-1'>
            <button
              type='button'
              onClick={() => setShowMoreWeatherInfo(false)}
              className='inline-flex items-center text-[11px] font-semibold text-neutral-600 hover:text-neutral-900'
            >
              Hide extra info
              <ChevronRight className='ml-1 h-3.5 w-3.5 rotate-90' />
            </button>
          </div>

          <div className='rounded-xl border border-neutral-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-3 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Sparkles className='h-4 w-4 text-emerald-700' />
                <h4 className='text-sm font-semibold text-neutral-900'>
                  More Weather Info
                </h4>
              </div>
              <span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800'>
                {weekSummary.riskLevel} Risk
              </span>
            </div>

            <div className='grid grid-cols-2 gap-2 text-[11px]'>
              <div className='rounded-lg bg-sky-50 p-2'>
                <p className='text-sky-700'>Historical Coverage</p>
                <p className='font-semibold text-sky-900'>
                  {weatherCoverage.historical} days
                </p>
              </div>
              <div className='rounded-lg bg-indigo-50 p-2'>
                <p className='text-indigo-700'>Forecast Coverage</p>
                <p className='font-semibold text-indigo-900'>
                  {weatherCoverage.forecast} days
                </p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Unavailable</p>
                <p className='font-semibold text-neutral-900'>
                  {weatherCoverage.unavailable} days
                </p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Avg Wind</p>
                <p className='font-semibold text-neutral-900'>
                  {weekSummary.avgWind.toFixed(0)} km/h
                </p>
              </div>
            </div>

            <div className='mt-2'>
              <div className='mb-1 flex items-center justify-between text-[10px] text-neutral-600'>
                <span className='inline-flex items-center gap-1'>
                  <Clock3 className='h-3 w-3' /> Rainy-day intensity
                </span>
                <span className='font-semibold text-neutral-800'>
                  {weatherCoverage.rainy}/{Math.max(1, availableDays.length)}
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
                <div
                  className='h-full bg-emerald-500 transition-all duration-500'
                  style={{
                    width: `${Math.min(100, (weatherCoverage.rainy / Math.max(1, availableDays.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {monthStats && (
              <div className='mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px]'>
                <div className='rounded-md bg-blue-50 py-1 text-blue-800'>
                  <p className='font-semibold'>{monthStats.totalRain} mm</p>
                  <p>rain total</p>
                </div>
                <div className='rounded-md bg-emerald-50 py-1 text-emerald-800'>
                  <p className='font-semibold'>{monthStats.goodDays}</p>
                  <p>good days</p>
                </div>
                <div className='rounded-md bg-amber-50 py-1 text-amber-800'>
                  <p className='font-semibold'>{weatherCoverage.hotDays}</p>
                  <p>hot days</p>
                </div>
              </div>
            )}

            <div className='mt-2 flex flex-wrap items-center gap-x-2 gap-y-1'>
              <span className='inline-flex items-center gap-0.5 text-[10px] text-neutral-500'>
                <Calendar className='h-3 w-3' />
                Seasonal timeline
              </span>
              <span className='inline-flex items-center gap-0.5 text-[10px] text-neutral-500'>
                <History className='h-3 w-3' />
                Historical + Forecast blend
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
