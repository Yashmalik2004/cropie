import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, Eye, EyeOff } from 'lucide-react';
import type { RangeMeta } from '@/types/farm';

export type MapLayerType = 'ndvi' | 'ndre' | 'ndwi' | 'anomaly';
export type LayerViewMode = 'masks' | 'range';

interface MaskOpacity {
  red?: number;
  yellow?: number;
  green?: number;
  brown?: number;
  light_blue?: number;
  purple?: number;
  pink?: number;
  light_green?: number;
  dark_green?: number;
  anomaly?: number;
}

interface MaskVisibility {
  red?: boolean;
  yellow?: boolean;
  green?: boolean;
  brown?: boolean;
  light_blue?: boolean;
  purple?: boolean;
  pink?: boolean;
  light_green?: boolean;
  dark_green?: boolean;
}

interface MapLayerSelectorProps {
  activeLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
  maskOpacity: MaskOpacity;
  onOpacityChange: (maskId: string, opacity: number) => void;
  maskVisibility?: MaskVisibility;
  onVisibilityChange?: (maskId: string, visible: boolean) => void;
  viewMode?: LayerViewMode;
  onViewModeChange?: (mode: LayerViewMode) => void;
  rangeOpacity?: number;
  onRangeOpacityChange?: (opacity: number) => void;
  rangeMeta?: RangeMeta | null; // gradient meta for the active layer
}

const LAYER_CONFIG: Record<MapLayerType, { label: string; shortLabel: string; description: string; masks: string[] }> = {
  ndvi: {
    label: 'Health Map (NDVI)',
    shortLabel: 'NDVI',
    description: 'Crop health status',
    masks: ['red', 'yellow', 'green'],
  },
  ndre: {
    label: 'Nutrient Map (NDRE)',
    shortLabel: 'NDRE',
    description: 'Nutrient status',
    masks: ['purple', 'pink', 'light_green', 'dark_green'],
  },
  ndwi: {
    label: 'Hydration Map (NDWI)',
    shortLabel: 'NDWI',
    description: 'Water stress levels',
    masks: ['brown', 'yellow', 'light_blue'],
  },
  anomaly: {
    label: 'Trend Map',
    shortLabel: 'Anomaly',
    description: 'Deviation from normal patterns',
    masks: [],
  },
};

const MASK_LABELS: Record<string, string> = {
  red: 'Stressed Areas',
  yellow: 'Moderate',
  green: 'Healthy Areas',
  brown: 'Very Low Water',
  light_blue: 'Moderate Water',
  purple: 'Stressed Vegetation',
  pink: 'Moderate Stress',
  light_green: 'Healthy',
  dark_green: 'Very Healthy',
};

const MASK_TOOLTIPS: Record<string, string> = {
  red: 'Areas with poor vegetation health — may indicate disease, drought, or nutrient deficiency',
  yellow: 'Areas with moderate vegetation — needs monitoring for potential decline',
  green: 'Areas with strong, healthy vegetation growth',
  brown: 'Severely water-stressed areas — irrigation may be needed urgently',
  light_blue: 'Moderate water content — adequate but not optimal hydration levels',
  purple: 'Vegetation under nutrient stress — may need fertilizer application',
  pink: 'Mild nutrient deficiency — early signs of stress',
  light_green: 'Good nutrient uptake and healthy chlorophyll levels',
  dark_green: 'Excellent nutrient status — optimal chlorophyll content',
};

const MASK_COLORS: Record<string, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  brown: '#8B4513',
  light_blue: '#87ceeb',
  purple: '#800080',
  pink: '#FF69B4',
  light_green: '#90EE90',
  dark_green: '#006400',
};

// Position a fixed-width-ish floating element so it stays inside the
// viewport. Returns final {top,left,placement} for the tooltip wrapper,
// flipping vertically when there isn't enough room above and clamping
// horizontally so it can't run off the side of the screen.
const TOOLTIP_HORIZONTAL_PADDING = 8;
const TOOLTIP_VERTICAL_GAP = 8;
const TOOLTIP_ESTIMATED_HEIGHT = 56;

type SmartPlacement = {
  top: number;
  left: number;
  placement: 'above' | 'below';
};

const placeTooltip = (
  anchorX: number,
  anchorTop: number,
  anchorBottom: number,
  estimatedWidth = 240
): SmartPlacement => {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  const placement: 'above' | 'below' =
    anchorTop - TOOLTIP_VERTICAL_GAP - TOOLTIP_ESTIMATED_HEIGHT >= 0
      ? 'above'
      : anchorBottom + TOOLTIP_VERTICAL_GAP + TOOLTIP_ESTIMATED_HEIGHT <= vh
        ? 'below'
        : 'above';

  const halfWidth = estimatedWidth / 2;
  const minLeft = TOOLTIP_HORIZONTAL_PADDING + halfWidth;
  const maxLeft = vw - TOOLTIP_HORIZONTAL_PADDING - halfWidth;
  const left = Math.max(minLeft, Math.min(maxLeft, anchorX));

  const top =
    placement === 'above'
      ? anchorTop - TOOLTIP_VERTICAL_GAP
      : anchorBottom + TOOLTIP_VERTICAL_GAP;

  return { top, left, placement };
};

// Tooltip wrapper. Renders the tooltip itself in a body-level portal so it
// can escape ancestor clipping (the panel uses overflow-hidden for the tab
// bar's rounded corners). Wrapper layout is configurable via className -
// default ``inline-block`` keeps icon/label triggers tight; pass
// ``block w-full`` when wrapping a full-width element like the gradient bar
// so the child's w-full doesn't collapse against an inline-block parent.
const Tooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  className?: string;
}> = ({ text, children, className }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<SmartPlacement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(
      placeTooltip(rect.left + rect.width / 2, rect.top, rect.bottom, 220)
    );
  };

  // Hide the tooltip on scroll/resize since the cached coords go stale.
  useEffect(() => {
    if (!show) return;
    const onMove = () => setShow(false);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [show]);

  return (
    <>
      <div
        ref={triggerRef}
        className={className ?? 'inline-block'}
        onMouseEnter={() => {
          updatePos();
          setShow(true);
        }}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed z-[10000] max-w-[220px] px-3 py-2 text-xs text-white bg-neutral-900 rounded-lg shadow-xl pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                transform:
                  pos.placement === 'above'
                    ? 'translate(-50%, -100%)'
                    : 'translate(-50%, 0)',
              }}
            >
              {text}
              <div
                className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                  pos.placement === 'above'
                    ? 'border-t-neutral-900'
                    : 'border-b-neutral-900'
                }`}
                style={pos.placement === 'above' ? { top: '100%' } : { bottom: '100%' }}
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
};

// Map a 0-1 ratio along the gradient back to its underlying value, the
// interpolated color, and a 3-zone descriptive band so the cursor tooltip
// can describe what the user is hovering over.
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const v = hex.replace('#', '');
  if (v.length !== 6) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
};

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' +
  [r, g, b]
    .map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
    .join('');

const sampleGradient = (
  meta: RangeMeta,
  ratio: number
): { value: number; color: string; band: string } => {
  const r = Math.max(0, Math.min(1, ratio));
  const value = meta.min + r * (meta.max - meta.min);
  const sortedStops = [...meta.stops].sort((a, b) => a.value - b.value);

  let color = sortedStops[0]?.color ?? '#888';
  if (sortedStops.length === 1) {
    color = sortedStops[0]!.color;
  } else if (value <= sortedStops[0]!.value) {
    color = sortedStops[0]!.color;
  } else if (value >= sortedStops[sortedStops.length - 1]!.value) {
    color = sortedStops[sortedStops.length - 1]!.color;
  } else {
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const a = sortedStops[i]!;
      const b = sortedStops[i + 1]!;
      if (value >= a.value && value <= b.value) {
        const t = (value - a.value) / Math.max(b.value - a.value, 1e-6);
        const c0 = hexToRgb(a.color);
        const c1 = hexToRgb(b.color);
        color = rgbToHex(
          c0.r + (c1.r - c0.r) * t,
          c0.g + (c1.g - c0.g) * t,
          c0.b + (c1.b - c0.b) * t
        );
        break;
      }
    }
  }

  const band =
    r < 1 / 3
      ? (meta.min_label ?? 'Lower range')
      : r < 2 / 3
        ? 'Middle range'
        : (meta.max_label ?? 'Upper range');

  return { value, color, band };
};

// Gradient bar with a cursor-tracking tooltip. As the user moves across the
// bar the tooltip updates with the position-derived value, color swatch,
// percentage along the bar, and a 3-zone descriptor.
const GradientHoverBar: React.FC<{
  meta: RangeMeta;
  gradientCss: string;
}> = ({ meta, gradientCss }) => {
  const [hover, setHover] = useState<{
    ratio: number;
    cursorX: number;
    barTop: number;
    barBottom: number;
  } | null>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1))
    );
    setHover({
      ratio,
      cursorX: event.clientX,
      barTop: rect.top,
      barBottom: rect.bottom,
    });
  };

  const computed = hover ? sampleGradient(meta, hover.ratio) : null;
  const placement = hover
    ? placeTooltip(hover.cursorX, hover.barTop, hover.barBottom, 200)
    : null;

  return (
    <>
      <div
        role="slider"
        aria-valuemin={meta.min}
        aria-valuemax={meta.max}
        aria-valuenow={computed ? Number(computed.value.toFixed(2)) : meta.min}
        className="relative h-4 w-full rounded border border-neutral-200 cursor-crosshair overflow-hidden"
        style={{ background: gradientCss }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {hover && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
            style={{ left: `${hover.ratio * 100}%` }}
          />
        )}
      </div>
      {hover && computed && placement && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed z-[10000] px-2.5 py-2 text-xs text-white bg-neutral-900 rounded-lg shadow-xl pointer-events-none"
              style={{
                top: placement.top,
                left: placement.left,
                transform:
                  placement.placement === 'above'
                    ? 'translate(-50%, -100%)'
                    : 'translate(-50%, 0)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded border border-white/40 flex-shrink-0"
                  style={{ backgroundColor: computed.color }}
                />
                <div>
                  <div className="font-semibold leading-tight">
                    {computed.value.toFixed(2)}
                    {meta.unit ? ` ${meta.unit}` : ''}
                  </div>
                  <div className="text-[10px] text-neutral-300 leading-tight">
                    {Math.round(hover.ratio * 100)}% · {computed.band}
                  </div>
                </div>
              </div>
              <div
                className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                  placement.placement === 'above'
                    ? 'border-t-neutral-900'
                    : 'border-b-neutral-900'
                }`}
                style={
                  placement.placement === 'above'
                    ? { top: '100%' }
                    : { bottom: '100%' }
                }
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  activeLayer,
  onLayerChange,
  maskOpacity,
  onOpacityChange,
  maskVisibility = {},
  onVisibilityChange,
  viewMode = 'masks',
  onViewModeChange,
  rangeOpacity = 0.7,
  onRangeOpacityChange,
  rangeMeta,
}) => {
  const getOpacity = (maskId: string): number => {
    return (maskOpacity[maskId as keyof MaskOpacity] ?? 0.7) * 100;
  };

  const getVisibility = (maskId: string): boolean => {
    return (maskVisibility[maskId as keyof MaskVisibility] ?? true);
  };

  const handleOpacityChange = (maskId: string, value: number) => {
    onOpacityChange(maskId, value / 100);
  };

  const handleVisibilityChange = (maskId: string) => {
    onVisibilityChange?.(maskId, !getVisibility(maskId));
  };

  const currentConfig = LAYER_CONFIG[activeLayer];
  const isAnomalyMode = activeLayer === 'anomaly';
  const showViewToggle =
    !isAnomalyMode && Boolean(onViewModeChange) && Boolean(rangeMeta);

  const buildGradientCss = (meta: RangeMeta): string => {
    if (!meta.stops.length) return 'linear-gradient(to right, #ddd, #888)';
    const span = Math.max(meta.max - meta.min, 1e-6);
    const parts = meta.stops.map(stop => {
      const pct = Math.max(0, Math.min(100, ((stop.value - meta.min) / span) * 100));
      return `${stop.color} ${pct.toFixed(2)}%`;
    });
    return `linear-gradient(to right, ${parts.join(', ')})`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-[1000] w-auto max-w-[520px]">
      <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
        {/* Panel Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              {currentConfig.label}
            </h4>
            {showViewToggle ? (
              <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
                <button
                  type="button"
                  onClick={() => onViewModeChange?.('masks')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                    viewMode === 'masks'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Masks
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange?.('range')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                    viewMode === 'range'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Range
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
                {currentConfig.description}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {isAnomalyMode ? (
              <>
                {/* Anomaly opacity slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700">
                      Anomaly Overlay
                    </label>
                    <span className="text-xs font-semibold text-neutral-600">
                      {getOpacity('anomaly').toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getOpacity('anomaly')}
                    onChange={(e) => handleOpacityChange('anomaly', Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Anomaly color legend */}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[11px] font-medium text-neutral-500">Color Legend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
                      <span className="text-[11px] text-neutral-600">Worse than average</span>
                    </div>
                    <div className="h-3 w-px bg-neutral-200" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                      <span className="text-[11px] text-neutral-600">Better than average</span>
                    </div>
                  </div>
                </div>
              </>
            ) : viewMode === 'range' && rangeMeta ? (
              <>
                {/* Single opacity slider for the gradient overlay */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700">
                      {rangeMeta.unit ?? 'Range'} Overlay
                    </label>
                    <span className="text-xs font-semibold text-neutral-600">
                      {Math.round(rangeOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(rangeOpacity * 100)}
                    onChange={(e) =>
                      onRangeOpacityChange?.(Number(e.target.value) / 100)
                    }
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Color bar legend with tooltip */}
                <div className="pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[11px] font-medium text-neutral-500">
                      {rangeMeta.unit ?? 'Index'} Scale
                    </span>
                  </div>
                  <GradientHoverBar
                    meta={rangeMeta}
                    gradientCss={buildGradientCss(rangeMeta)}
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-600">
                    <span>
                      <span className="font-semibold text-neutral-800">
                        {rangeMeta.min.toFixed(2)}
                      </span>
                      {rangeMeta.min_label ? ` · ${rangeMeta.min_label}` : ''}
                    </span>
                    <span className="text-right">
                      {rangeMeta.max_label ? `${rangeMeta.max_label} · ` : ''}
                      <span className="font-semibold text-neutral-800">
                        {rangeMeta.max.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              currentConfig.masks.map((maskId) => {
                const isVisible = getVisibility(maskId);
                return (
                  <div key={maskId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Tooltip text={MASK_TOOLTIPS[maskId] ?? ''}>
                          <div
                            className="w-3 h-3 rounded-full border border-neutral-300 cursor-help"
                            style={{ backgroundColor: MASK_COLORS[maskId] }}
                          />
                        </Tooltip>
                        <Tooltip text={MASK_TOOLTIPS[maskId] ?? ''}>
                          <label className="text-xs font-medium text-neutral-700 cursor-help">
                            {MASK_LABELS[maskId]}
                          </label>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVisibilityChange(maskId)}
                          className={`p-1 rounded transition-colors ${
                            isVisible
                              ? 'text-neutral-600 hover:bg-neutral-100'
                              : 'text-neutral-300 hover:bg-neutral-100'
                          }`}
                          title={isVisible ? 'Hide mask' : 'Show mask'}
                        >
                          {isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <span className="text-xs font-semibold text-neutral-600 min-w-[28px] text-right">
                          {getOpacity(maskId).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={getOpacity(maskId)}
                      onChange={(e) => handleOpacityChange(maskId, Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      disabled={!isVisible}
                      style={{
                        opacity: isVisible ? 1 : 0.5,
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-neutral-200">
          {Object.entries(LAYER_CONFIG).map(([layerId, config]) => {
            const isActive = activeLayer === layerId;
            return (
              <button
                key={layerId}
                onClick={() => onLayerChange(layerId as MapLayerType)}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all relative whitespace-nowrap ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {config.shortLabel}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
