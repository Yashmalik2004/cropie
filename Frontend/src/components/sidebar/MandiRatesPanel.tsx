import React, { useMemo, useState, useEffect } from 'react';
import { Store, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AgmarknetData, MandiDayData } from '@/types/farm';

interface MandiRatesPanelProps {
  govdata: MandiDayData[];
  agmarknet?: AgmarknetData | undefined;
  aiAnalysis?: string;
}

type Unit = 'quintal' | 'kg';

const LINE_COLORS = [
  '#0ea5e9',
  '#f97316',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#eab308',
  '#ec4899',
  '#14b8a6',
];

const formatDateShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const MandiRatesPanel: React.FC<MandiRatesPanelProps> = ({
  govdata,
  agmarknet,
  aiAnalysis,
}) => {
  const [district, setDistrict] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('quintal');
  const [districtInitialized, setDistrictInitialized] = useState(false);

  // Sort days ascending by date so the chart reads left→right old→new
  // Show all 7 days
  const sortedDays = useMemo(
    () =>
      [...govdata]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7),
    [govdata]
  );

  const districts = useMemo(() => {
    const set = new Set<string>();
    
    // Extract districts from govdata
    sortedDays.forEach(day => day.records.forEach(r => set.add(r.district)));
    
    // If govdata has no districts but agmarknet does, use agmarknet districts
    if (set.size === 0 && agmarknet?.rows && Array.isArray(agmarknet.rows)) {
      agmarknet.rows.forEach(row => {
        const district = row.district;
        if (typeof district === 'string' && district.trim()) {
          set.add(district.trim());
        }
      });
    }
    
    return Array.from(set).sort();
  }, [sortedDays, agmarknet]);

  // Initialize district on first render
  useEffect(() => {
    if (!districtInitialized && districts.length > 0 && !district) {
      const firstDistrict = districts[0];
      if (firstDistrict) {
        setDistrict(firstDistrict);
        setDistrictInitialized(true);
      }
    }
  }, [districtInitialized, districts]);

  const markets = useMemo(() => {
    if (!district) return [];
    const set = new Set<string>();
    sortedDays.forEach(day =>
      day.records
        .filter(r => r.district === district)
        .forEach(r => set.add(r.market))
    );
    return Array.from(set).sort();
  }, [sortedDays, district]);

  // Build chart data: one row per day, one key per market (avg modal_price across varieties)
  const chartData = useMemo(() => {
    const divisor = unit === 'kg' ? 100 : 1;
    return sortedDays.map(day => {
      const row: Record<string, string | number> = {
        date: formatDateShort(day.date),
      };
      markets.forEach(m => {
        const matching = day.records.filter(
          r => r.district === district && r.market === m
        );
        if (matching.length > 0) {
          const avg =
            matching.reduce((s, r) => s + r.modal_price, 0) / matching.length;
          row[m] = +(avg / divisor).toFixed(2);
        }
      });
      return row;
    });
  }, [sortedDays, district, markets, unit]);

  const unitLabel = unit === 'kg' ? '₹/kg' : '₹/qn';
  const normalizedAiAnalysis = aiAnalysis?.trim();

  if ((!govdata || govdata.length === 0) && !normalizedAiAnalysis) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <Store className='h-12 w-12 text-neutral-300 mb-3' />
        <p className='text-sm text-neutral-600'>No mandi rate data available</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {normalizedAiAnalysis && (
        <div className='rounded-lg border border-rose-200 bg-rose-50 p-3'>
          <div className='flex items-center gap-1.5'>
            <Sparkles className='h-3.5 w-3.5 text-rose-700' />
            <p className='text-[11px] font-semibold uppercase tracking-wide text-rose-700'>
              AI Mandi Analysis
            </p>
          </div>
          <p className='mt-1 text-xs leading-relaxed text-rose-900'>
            {normalizedAiAnalysis}
          </p>
        </div>
      )}

      {!govdata || govdata.length === 0 ? (
        // If no govdata but agmarknet exists, show agmarknet directly
        agmarknet && agmarknet.success && agmarknet.rows && agmarknet.rows.length > 0 ? (
          <div className='space-y-3'>
            {/* District selector from agmarknet */}
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>
                District
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className='w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400'
              >
                {districts.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit toggle */}
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>
                Unit
              </label>
              <div className='inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50'>
                <button
                  onClick={() => setUnit('quintal')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    unit === 'quintal'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ₹ / quintal
                </button>
                <button
                  onClick={() => setUnit('kg')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    unit === 'kg'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ₹ / kg
                </button>
              </div>
            </div>

            {/* Agmarknet Bar Chart */}
            {district && (
              <div className='border border-neutral-200 rounded-lg p-2 bg-white'>
                <div className='flex items-center justify-between mb-1.5 px-1'>
                  <div className='text-xs font-semibold text-neutral-900'>
                    {district} Wholesale Prices
                  </div>
                  <div className='text-[10px] text-neutral-500'>Monthly Comparison</div>
                </div>
                {(() => {
                  const districtData = (
                    agmarknet.rows as Array<
                      Record<string, string | number | null>
                    >
                  ).find(row => row.district === district);
                  if (!districtData) {
                    return (
                      <div className='py-4 text-center text-sm text-neutral-500'>
                        No agmarknet data available for {district}
                      </div>
                    );
                  }
                  const divisor = unit === 'kg' ? 100 : 1;
                  const priceKeys = Object.keys(districtData)
                    .filter(key => key.startsWith('prices_'))
                    .sort();

                  const chartData = priceKeys
                    .map(key => {
                      const price = districtData[key];
                      // Convert prices_april_2026 to April 2026
                      const monthName = key
                        .replace('prices_', '')
                        .split('_')
                        .map(
                          part => part.charAt(0).toUpperCase() + part.slice(1)
                        )
                        .join(' ');

                      return {
                        month: monthName,
                        key,
                        price: price
                          ? +((price as number) / divisor).toFixed(2)
                          : null,
                      };
                    })
                    .filter(d => d.price !== null);

                  if (chartData.length === 0) {
                    return (
                      <div className='py-4 text-center text-sm text-neutral-500'>
                        No price data available.
                      </div>
                    );
                  }

                  return (
                    <>
                      <ResponsiveContainer width='100%' height={200}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: -12, bottom: 30 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='#e5e5e5'
                          />
                          <XAxis dataKey='month' tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            formatter={v => {
                              const value =
                                typeof v === 'number'
                                  ? v
                                  : typeof v === 'string'
                                    ? parseFloat(v)
                                    : 0;
                              return Number.isNaN(value)
                                ? 'N/A'
                                : `${value} ${unitLabel}`;
                            }}
                          />
                          <Bar dataKey='price' fill='#10b981' name='Price' />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className='text-[10px] text-neutral-600 mt-2 px-1 space-y-1'>
                        {chartData.map(item => (
                          <div key={item.key}>
                            <span className='font-medium'>{item.month}:</span>{' '}
                            {item.price} {unitLabel}
                          </div>
                        ))}
                        <div>
                          <span className='font-medium'>
                            Previous Month Change:
                          </span>{' '}
                          {districtData.change_over_previous_month ?? 'N/A'}%
                        </div>
                        <div>
                          <span className='font-medium'>YoY Change:</span>{' '}
                          {districtData.change_over_previous_year ?? 'N/A'}%
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Store className='h-12 w-12 text-neutral-300 mb-3' />
            <p className='text-sm text-neutral-600'>
              No mandi rate data available
            </p>
          </div>
        )
      ) : (
        <>
          {/* District */}
          <div>
            <label className='block text-xs font-medium text-neutral-700 mb-1'>
              District
            </label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className='w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400'
            >
              {districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Unit toggle */}
          <div>
            <label className='block text-xs font-medium text-neutral-700 mb-1'>
              Unit
            </label>
            <div className='inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50'>
              <button
                onClick={() => setUnit('quintal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === 'quintal'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ₹ / quintal
              </button>
              <button
                onClick={() => setUnit('kg')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === 'kg'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ₹ / kg
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className='border border-neutral-200 rounded-lg p-2 bg-white'>
            <div className='flex items-center justify-between mb-1.5 px-1'>
              <div className='text-xs font-semibold text-neutral-900'>
                Market Trends — 7 day modal price
              </div>
              <div className='text-[10px] text-neutral-500'>{unitLabel}</div>
            </div>
            {markets.length === 0 ? (
              <div className='py-8 text-center text-sm text-neutral-500'>
                No markets available for this selection.
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={240}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='#e5e5e5' />
                  <XAxis dataKey='date' tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={v => {
                      const value =
                        typeof v === 'number' ? v : parseFloat(v as string);
                      return Number.isNaN(value)
                        ? 'N/A'
                        : `${value} ${unitLabel}`;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {markets.map((m, i) => (
                    <Line
                      key={m}
                      type='monotone'
                      dataKey={m}
                      stroke={LINE_COLORS[i % LINE_COLORS.length] as string}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Markets list summary */}
          {markets.length > 0 && (
            <div className='text-[11px] text-neutral-600'>
              <span className='font-medium text-neutral-800'>Markets:</span>{' '}
              {markets.join(', ')}
            </div>
          )}

          {/* Agmarknet Bar Chart - Selected District Prices */}
          {agmarknet &&
            agmarknet.success &&
            agmarknet.rows &&
            agmarknet.rows.length > 0 &&
            district && (
              <div className='border border-neutral-200 rounded-lg p-2 bg-white mt-4'>
                <div className='flex items-center justify-between mb-1.5 px-1'>
                  <div className='text-xs font-semibold text-neutral-900'>
                    {district} Wholesale Prices
                  </div>
                  <div className='text-[10px] text-neutral-500'>Comparison</div>
                </div>
                {(() => {
                  const districtData = (
                    agmarknet.rows as Array<
                      Record<string, string | number | null>
                    >
                  ).find(row => row.district === district);
                  if (!districtData) {
                    return (
                      <div className='py-4 text-center text-sm text-neutral-500'>
                        No agmarknet data available for {district}
                      </div>
                    );
                  }
                  const divisor = unit === 'kg' ? 100 : 1;
                  const priceKeys = Object.keys(districtData)
                    .filter(key => key.startsWith('prices_'))
                    .sort();

                  const chartData = priceKeys
                    .map(key => {
                      const price = districtData[key];
                      // Convert prices_april_2026 to April 2026
                      const monthName = key
                        .replace('prices_', '')
                        .split('_')
                        .map(
                          part => part.charAt(0).toUpperCase() + part.slice(1)
                        )
                        .join(' ');

                      return {
                        month: monthName,
                        key,
                        price: price
                          ? +((price as number) / divisor).toFixed(2)
                          : null,
                      };
                    })
                    .filter(d => d.price !== null);

                  if (chartData.length === 0) {
                    return (
                      <div className='py-4 text-center text-sm text-neutral-500'>
                        No price data available.
                      </div>
                    );
                  }

                  return (
                    <>
                      <ResponsiveContainer width='100%' height={200}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: -12, bottom: 30 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='#e5e5e5'
                          />
                          <XAxis dataKey='month' tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            formatter={v => {
                              const value =
                                typeof v === 'number'
                                  ? v
                                  : typeof v === 'string'
                                    ? parseFloat(v)
                                    : 0;
                              return Number.isNaN(value)
                                ? 'N/A'
                                : `${value} ${unitLabel}`;
                            }}
                          />
                          <Bar dataKey='price' fill='#10b981' name='Price' />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className='text-[10px] text-neutral-600 mt-2 px-1 space-y-1'>
                        {chartData.map(item => (
                          <div key={item.key}>
                            <span className='font-medium'>{item.month}:</span>{' '}
                            {item.price} {unitLabel}
                          </div>
                        ))}
                        <div>
                          <span className='font-medium'>
                            Previous Month Change:
                          </span>{' '}
                          {districtData.change_over_previous_month ?? 'N/A'}%
                        </div>
                        <div>
                          <span className='font-medium'>YoY Change:</span>{' '}
                          {districtData.change_over_previous_year ?? 'N/A'}%
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
        </>
      )}
    </div>
  );
};
