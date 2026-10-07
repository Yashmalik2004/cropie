import React from 'react';
import { Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Sprout,
  Calendar,
  MapPin,
  Navigation,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
} from 'lucide-react';
import type { Farm, HeatmapData } from '@/types/farm';
import { formatArea, formatDate } from '@/utils';

interface FarmOverviewPanelProps {
  farm: Farm;
  heatmapData?: HeatmapData | null;
  canEdit: boolean;
  onDelete: () => void;
  onOpenTrends: () => void;
  onViewOnMap: () => void;
}

const HEALTH_STYLES: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Good: 'bg-lime-100 text-lime-800 border-lime-200',
  Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  Poor: 'bg-orange-100 text-orange-800 border-orange-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
};

type HealthLabel = 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';

const deriveOverallHealth = (riskScore: number): HealthLabel => {
  if (riskScore >= 60) return 'Critical';
  if (riskScore >= 40) return 'Poor';
  if (riskScore >= 25) return 'Moderate';
  if (riskScore >= 10) return 'Good';
  return 'Excellent';
};

type HealthTrend = 'improving' | 'stable' | 'declining' | null;

interface HealthTrendInfo {
  direction: HealthTrend;
  deltaPct: number;
  priorYearsCount: number;
}

const computeHealthTrend = (
  ndviTrend: { date: string; mean_ndvi: number }[] | undefined
): HealthTrendInfo => {
  if (!ndviTrend || ndviTrend.length < 2) {
    return { direction: null, deltaPct: 0, priorYearsCount: 0 };
  }
  const sorted = ndviTrend.slice().sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1]!.mean_ndvi;
  const priorPoints = sorted.slice(0, -1);
  const priorAvg =
    priorPoints.reduce((sum, p) => sum + p.mean_ndvi, 0) / priorPoints.length;
  if (!Number.isFinite(latest) || !Number.isFinite(priorAvg) || priorAvg <= 0) {
    return { direction: null, deltaPct: 0, priorYearsCount: 0 };
  }
  const deltaPct = ((latest - priorAvg) / Math.abs(priorAvg)) * 100;
  const priorYearsCount = priorPoints.length;
  if (Math.abs(deltaPct) < 3) {
    return { direction: 'stable', deltaPct, priorYearsCount };
  }
  return {
    direction: deltaPct > 0 ? 'improving' : 'declining',
    deltaPct,
    priorYearsCount,
  };
};

// Each band gets a fixed color, label, and the key it reads from the
// pixel-counts dictionary the backend returns. Centralising these lets the
// Maps Overview render every band's percentage chip with the same code path.
type BandSpec = { key: string; color: string; label: string };

const NDVI_BANDS: BandSpec[] = [
  { key: 'green', color: '#22c55e', label: 'Healthy' },
  { key: 'yellow', color: '#eab308', label: 'Moderate' },
  { key: 'red', color: '#ef4444', label: 'Stressed' },
];
const NDWI_BANDS: BandSpec[] = [
  { key: 'light_blue', color: '#87CEFA', label: 'Moderate water' },
  { key: 'yellow', color: '#eab308', label: 'Low water' },
  { key: 'brown', color: '#8B4513', label: 'Very low water' },
];
const NDRE_BANDS: BandSpec[] = [
  { key: 'dark_green', color: '#006400', label: 'High chlorophyll' },
  { key: 'light_green', color: '#90EE90', label: 'Healthy' },
  { key: 'pink', color: '#FF69B4', label: 'Mild deficiency' },
  { key: 'purple', color: '#800080', label: 'Stressed' },
];

interface BandShare {
  spec: BandSpec;
  pct: number;
}

const computeBandShares = (
  counts: Record<string, number | undefined> | undefined,
  bands: BandSpec[]
): BandShare[] | null => {
  if (!counts) return null;
  const total = bands.reduce(
    (sum, b) => sum + Math.max(0, Number(counts[b.key] ?? 0)),
    0
  );
  if (total <= 0) return null;
  return bands.map(b => ({
    spec: b,
    pct: (Math.max(0, Number(counts[b.key] ?? 0)) / total) * 100,
  }));
};

const IndexRow: React.FC<{
  label: string;
  shares: BandShare[] | null;
}> = ({ label, shares }) => {
  const hasData = !!shares && shares.some(s => s.pct > 0);

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-semibold text-neutral-800'>{label}</span>
        {!hasData && (
          <span className='text-[11px] text-neutral-400'>Unavailable</span>
        )}
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
        {hasData && shares ? (
          <div className='flex h-full w-full'>
            {shares.map(s => (
              <div
                key={s.spec.key}
                style={{ width: `${s.pct}%`, backgroundColor: s.spec.color }}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {(shares ?? bandsPlaceholder(label)).map((s, i) => (
          <span
            key={`${s.spec.key}-${i}`}
            className={`inline-flex items-center gap-1 rounded-md border border-neutral-200 px-1.5 py-0.5 text-[11px] ${
              hasData
                ? 'text-neutral-800 bg-white'
                : 'text-neutral-400 bg-neutral-50'
            }`}
          >
            <span
              className='inline-block h-2 w-2 rounded-full'
              style={{ backgroundColor: s.spec.color }}
            />
            <span className='font-medium'>{s.spec.label}</span>
            <span className='tabular-nums font-semibold'>
              {hasData ? `${s.pct.toFixed(0)}%` : '—'}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

// Used when an index has no data yet - we still render the chips (greyed
// out) so the row's height stays the same as a populated one. Picks the
// right spec list based on the row label.
const bandsPlaceholder = (label: string): BandShare[] => {
  const specs = label.includes('NDVI')
    ? NDVI_BANDS
    : label.includes('NDWI')
      ? NDWI_BANDS
      : NDRE_BANDS;
  return specs.map(spec => ({ spec, pct: 0 }));
};

const formatAnalysisDate = (raw?: string): string | null => {
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const FarmOverviewPanel: React.FC<FarmOverviewPanelProps> = ({
  farm,
  heatmapData,
  canEdit,
  onDelete,
  onOpenTrends,
  onViewOnMap,
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const DESCRIPTION_PREVIEW_CHARS = 60;

  const location = heatmapData?.location;
  const pixelCounts = heatmapData?.pixel_counts;

  const totalPixels =
    (pixelCounts?.valid && pixelCounts.valid > 0
      ? pixelCounts.valid
      : (pixelCounts?.red ?? 0) +
        (pixelCounts?.yellow ?? 0) +
        (pixelCounts?.green ?? 0)) || 0;

  const yellowPct =
    totalPixels > 0 ? ((pixelCounts?.yellow ?? 0) / totalPixels) * 100 : 0;
  const redPct =
    totalPixels > 0 ? ((pixelCounts?.red ?? 0) / totalPixels) * 100 : 0;

  const riskScore = Math.max(0, Math.min(100, redPct * 0.7 + yellowPct * 0.3));
  const overallHealth = deriveOverallHealth(riskScore);
  const healthTrend = computeHealthTrend(heatmapData?.anomaly?.ndvi_trend);

  const descriptionPreview = farm.description
    ? farm.description.length > DESCRIPTION_PREVIEW_CHARS
      ? `${farm.description.slice(0, DESCRIPTION_PREVIEW_CHARS)}...`
      : farm.description
    : '';

  // --- Field timeline math ---
  const plantingDate = new Date(farm.plantingDate);
  const harvestDate = new Date(farm.harvestDate);
  const now = new Date();
  const totalCycleDays = Math.max(
    1,
    Math.ceil(
      (harvestDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const daysSincePlanting = Math.max(
    0,
    Math.ceil((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const cycleProgress = Math.max(
    0,
    Math.min(100, (daysSincePlanting / totalCycleDays) * 100)
  );

  let cropStage = 'Planned';
  if (now > harvestDate) cropStage = 'Completed';
  else if (now >= plantingDate) {
    cropStage = cycleProgress >= 90 ? 'Harvest Window' : 'Growing';
  }
  const isCycleCompleted = cropStage === 'Completed' || daysRemaining === 0;

  const boundaryPoints =
    farm.coordinates?.filter(point => point.length >= 2).length ?? 0;

  const ndviShares = computeBandShares(
    pixelCounts as Record<string, number> | undefined,
    NDVI_BANDS
  );
  const ndwiShares = computeBandShares(
    heatmapData?.ndwi_pixel_counts as Record<string, number> | undefined,
    NDWI_BANDS
  );
  const ndreShares = computeBandShares(
    heatmapData?.ndre_pixel_counts as Record<string, number> | undefined,
    NDRE_BANDS
  );

  const analysisDate = formatAnalysisDate(heatmapData?.date_used);

  const trendIcon =
    healthTrend.direction === 'improving' ? (
      <ArrowUpRight className='h-3.5 w-3.5 text-emerald-700' />
    ) : healthTrend.direction === 'declining' ? (
      <ArrowDownRight className='h-3.5 w-3.5 text-red-700' />
    ) : healthTrend.direction === 'stable' ? (
      <Minus className='h-3.5 w-3.5 text-neutral-500' />
    ) : null;

  const trendBasisText =
    healthTrend.priorYearsCount > 0
      ? `Latest NDVI vs the average of the previous ${healthTrend.priorYearsCount} year${
          healthTrend.priorYearsCount === 1 ? '' : 's'
        } at the same calendar window.`
      : 'Compares the latest year-over-year NDVI to the prior baseline.';

  return (
    <div className='space-y-3'>
      {/* --- Themed Banner Header --- */}
      <div className='relative overflow-hidden rounded-xl border border-emerald-200 bg-[linear-gradient(130deg,#064e3b_0%,#065f46_35%,#10b981_100%)] p-3.5 text-white shadow-sm'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/20 blur-xl' />
        <div className='pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-300/30 blur-xl' />
        <div className='relative flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2.5'>
              <div className='h-10 w-10 p-2 rounded-xl border border-white/35 bg-white/15 backdrop-blur flex items-center justify-center shadow-sm'>
                <Sprout className='h-5 w-5 text-emerald-50' />
              </div>
              <h2 className='truncate text-base font-bold text-white'>
                {farm.name}
              </h2>
            </div>
            <div className='mt-2 flex flex-wrap items-center gap-1.5'>
              <span className='inline-flex items-center rounded-full border border-white/40 bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white'>
                {farm.crop}
              </span>
              {location?.district && (
                <span className='inline-flex items-center rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-xs font-medium text-emerald-50'>
                  <MapPin className='mr-1 h-3 w-3' />
                  {location.district}
                </span>
              )}
            </div>
            {farm.description && (
              <div className='mt-2 text-xs leading-4 text-emerald-50'>
                <p>
                  {descriptionExpanded ? farm.description : descriptionPreview}
                </p>
                {farm.description.length > DESCRIPTION_PREVIEW_CHARS && (
                  <button
                    type='button'
                    onClick={() => setDescriptionExpanded(prev => !prev)}
                    className='mt-1 inline-flex items-center text-xs font-semibold text-white hover:text-emerald-100'
                  >
                    {descriptionExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className='flex flex-col items-end gap-1.5 min-w-[120px] flex-shrink-0'>
            {canEdit && (
              <div className='flex items-center gap-1'>
                <Link
                  to={`/farm/${farm.id}/edit`}
                  className='inline-flex items-center rounded-md border border-white/40 bg-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/25'
                >
                  <Edit className='mr-1 h-3 w-3' />
                  Edit
                </Link>
                <button
                  type='button'
                  onClick={onDelete}
                  className='inline-flex items-center rounded-md border border-red-200/70 bg-white/15 px-2 py-1 text-xs font-semibold text-red-100 hover:bg-red-400/20'
                >
                  <Trash2 className='mr-1 h-3 w-3' />
                  Delete
                </button>
              </div>
            )}
            <div className='w-full space-y-1 text-xs'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-emerald-100'>Health</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border bg-white/95 px-2 py-0.5 text-xs font-semibold ${
                    HEALTH_STYLES[overallHealth] ?? HEALTH_STYLES.Moderate
                  }`}
                >
                  {overallHealth}
                  {trendIcon}
                </span>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-emerald-100'>Stage</span>
                <span className='font-semibold text-white'>{cropStage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- Maps Overview --- */}
      <div className='rounded-xl border border-neutral-200 bg-white p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-1.5'>
            <Layers className='h-4 w-4 text-emerald-700' />
            <h3 className='text-sm font-semibold text-neutral-900'>
              Maps Overview
            </h3>
          </div>
          {analysisDate && (
            <span
              className='text-[11px] text-neutral-500'
              title='Source: Sentinel-2 (Copernicus)'
            >
              {analysisDate} · Sentinel-2
            </span>
          )}
        </div>
        <div className='space-y-3'>
          <IndexRow label='Health (NDVI)' shares={ndviShares} />
          <IndexRow label='Water (NDWI)' shares={ndwiShares} />
          <IndexRow label='Nutrition (NDRE)' shares={ndreShares} />
        </div>
      </div>
      {/* --- Location --- */}
      <div className='rounded-xl border border-neutral-200 bg-white p-3 shadow-sm'>
        <div className='mb-2 flex items-center gap-1.5'>
          <Navigation className='h-4 w-4 text-rose-600' />
          <h3 className='text-sm font-semibold text-neutral-900'>Location</h3>
        </div>
        <p className='rounded-md bg-neutral-50 px-2 py-1.5 text-xs leading-4 text-neutral-700'>
          {location?.complete_address ?? 'Address unavailable'}
        </p>
        <div className='mt-2 grid grid-cols-2 gap-1.5 text-xs'>
          <div className='rounded-md bg-neutral-50 p-1.5'>
            <p className='text-[11px] text-neutral-500'>District</p>
            <p className='font-semibold text-neutral-900 truncate'>
              {location?.district ?? '—'}
            </p>
          </div>
          <div className='rounded-md bg-neutral-50 p-1.5'>
            <p className='text-[11px] text-neutral-500'>State</p>
            <p className='font-semibold text-neutral-900 truncate'>
              {location?.state ?? '—'}
            </p>
          </div>
          <div className='rounded-md bg-neutral-50 p-1.5'>
            <p className='text-[11px] text-neutral-500'>Latitude</p>
            <p className='font-semibold text-neutral-800 tabular-nums'>
              {location?.coordinates?.latitude?.toFixed(5) ?? '—'}
            </p>
          </div>
          <div className='rounded-md bg-neutral-50 p-1.5'>
            <p className='text-[11px] text-neutral-500'>Longitude</p>
            <p className='font-semibold text-neutral-800 tabular-nums'>
              {location?.coordinates?.longitude?.toFixed(5) ?? '—'}
            </p>
          </div>
        </div>
        <div className='mt-2 flex items-center justify-between text-xs'>
          <span className='text-neutral-600'>
            <span className='text-neutral-500'>Area: </span>
            <span className='font-semibold text-neutral-900'>
              {formatArea(farm.area)}
            </span>
            <span className='mx-1.5 text-neutral-300'>·</span>
            <span className='text-neutral-500'>Boundary: </span>
            <span className='font-semibold text-neutral-900'>
              {boundaryPoints} pts
            </span>
          </span>
          <button
            type='button'
            onClick={onViewOnMap}
            className='inline-flex items-center font-semibold text-emerald-700 hover:text-emerald-900'
          >
            View on map
            <ChevronRight className='ml-0.5 h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      {/* --- Field Timeline --- */}
      <div className='rounded-xl border border-neutral-200 bg-white p-3 shadow-sm'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-4 w-4 text-sky-600' />
            <h3 className='text-sm font-semibold text-neutral-900'>
              Field Timeline
            </h3>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isCycleCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : cropStage === 'Harvest Window'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-800'
            }`}
          >
            {cropStage}
          </span>
        </div>

        <div className='grid grid-cols-2 gap-1.5 text-xs'>
          <div className='rounded-md bg-sky-50 p-1.5'>
            <p className='text-[11px] text-sky-700'>Planting</p>
            <p className='font-semibold text-sky-900'>
              {formatDate(farm.plantingDate)}
            </p>
          </div>
          <div className='rounded-md bg-indigo-50 p-1.5'>
            <p className='text-[11px] text-indigo-700'>Harvest</p>
            <p className='font-semibold text-indigo-900'>
              {formatDate(farm.harvestDate)}
            </p>
          </div>
        </div>

        <div className='mt-2'>
          <div className='mb-1 flex items-center justify-between text-[11px] text-neutral-600'>
            <span>
              Day {daysSincePlanting} of {totalCycleDays}
            </span>
            <span className='font-semibold text-neutral-800 tabular-nums'>
              {Math.round(cycleProgress)}%
            </span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
            <div
              className={`h-full ${isCycleCompleted ? 'bg-emerald-500' : 'bg-sky-500'}`}
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
          <p className='mt-1 text-[11px] text-neutral-500'>
            {isCycleCompleted
              ? `Harvested on ${formatDate(farm.harvestDate, 'dd MMM yyyy')}`
              : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
          </p>
        </div>

        {healthTrend.direction && (
          <div className='mt-2 rounded-md border border-neutral-100 bg-neutral-50 px-2 py-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='inline-flex items-center gap-1 text-neutral-700'>
                {trendIcon}
                <span className='font-semibold text-neutral-900'>
                  {healthTrend.direction === 'improving'
                    ? 'Improving'
                    : healthTrend.direction === 'declining'
                      ? 'Declining'
                      : 'Stable'}
                </span>
                <span className='text-neutral-500'>
                  vs prior {healthTrend.priorYearsCount} year
                  {healthTrend.priorYearsCount === 1 ? '' : 's'}
                </span>
              </span>
              <span className='tabular-nums font-semibold text-neutral-900'>
                {healthTrend.deltaPct >= 0 ? '+' : ''}
                {healthTrend.deltaPct.toFixed(1)}%
              </span>
            </div>
            <p className='mt-1 text-[11px] leading-4 text-neutral-500'>
              {trendBasisText}
            </p>
            <button
              type='button'
              onClick={onOpenTrends}
              className='mt-1.5 inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900'
            >
              View NDVI trends
              <ChevronRight className='ml-0.5 h-3.5 w-3.5' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
