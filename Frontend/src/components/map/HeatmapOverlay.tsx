import React, { useState, useRef, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  ScaleControl,
  ImageOverlay,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LocateFixed,
  Settings,
} from 'lucide-react';
import type { HeatmapData } from '@/types/farm';
import 'leaflet/dist/leaflet.css';
import './HeatmapOverlay.css';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export type LayerType = 'ndvi' | 'ndwi' | 'ndre' | 'anomaly';

export type LayerViewMode = 'masks' | 'range';

interface HeatmapOverlayProps {
  coordinates: number[][]; // Array of [lng, lat] pairs
  heatmapData?: HeatmapData | null;
  height?: string;
  className?: string;
  activeLayer?: LayerType;
  onLayerChange?: (layer: LayerType) => void;
  maskOpacity?: Record<string, number>; // Individual mask opacity: { red: 0.7, yellow: 0.6, ... }
  maskVisibility?: Record<string, boolean>; // Individual mask visibility: { red: true, yellow: false, ... }
  anomalyTileUrl?: string | undefined; // Tile URL for anomaly map
  focusRequestId?: number;
  viewMode?: LayerViewMode; // 'masks' shows discrete colors, 'range' shows gradient
  rangeOpacity?: number; // 0-1, only used in range mode
}

interface MaskOverlay {
  id: string;
  name: string;
  color: string;
  base64Data: string;
  opacity: number;
  visible: boolean;
}

// NDVI mask set (red -> yellow -> green)
const createNdviMaskSet = (): MaskOverlay[] => [
  {
    id: 'red',
    name: 'Stressed Areas',
    color: '#ef4444',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'yellow',
    name: 'Moderate Health',
    color: '#eab308',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'green',
    name: 'Healthy Areas',
    color: '#22c55e',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
];

// NDWI mask set (brown -> yellow -> light blue)
const createNdwiMaskSet = (): MaskOverlay[] => [
  {
    id: 'brown',
    name: 'Very Low Water',
    color: '#8B4513',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'yellow',
    name: 'Low Water',
    color: '#eab308',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'light_blue',
    name: 'Moderate Water',
    color: '#87CEFA',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
];

// NDRE mask set (purple -> pink -> light green -> dark green)
const createNdreMaskSet = (): MaskOverlay[] => [
  {
    id: 'purple',
    name: 'Stressed Vegetation',
    color: '#800080',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'pink',
    name: 'Moderate Stress',
    color: '#FF69B4',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'light_green',
    name: 'Healthy',
    color: '#90EE90',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
  {
    id: 'dark_green',
    name: 'Very Healthy',
    color: '#006400',
    base64Data: '',
    opacity: 0.7,
    visible: true,
  },
];

// Component to handle anomaly image overlay with bounds
const AnomalyImageOverlay: React.FC<{
  coordinates: number[][];
  anomalyTileUrl: string | undefined;
  opacity: number;
}> = ({ coordinates, anomalyTileUrl, opacity }) => {
  // Calculate bounds from coordinates
  const getBounds = (): L.LatLngBounds | null => {
    if (coordinates.length === 0) return null;

    const leafletCoords: [number, number][] = coordinates
      .filter(
        (coord): coord is [number, number] =>
          Array.isArray(coord) && coord.length >= 2
      )
      .map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]

    if (leafletCoords.length === 0) return null;

    const lats = leafletCoords.map(coord => coord[0]);
    const lngs = leafletCoords.map(coord => coord[1]);

    const southWest = L.latLng(Math.min(...lats), Math.min(...lngs));
    const northEast = L.latLng(Math.max(...lats), Math.max(...lngs));

    return L.latLngBounds(southWest, northEast);
  };

  const bounds = getBounds();

  if (!bounds || !anomalyTileUrl) return null;

  return (
    <ImageOverlay
      url={anomalyTileUrl}
      bounds={bounds}
      opacity={opacity}
      crossOrigin='anonymous'
    />
  );
};

// Component to render a single continuous-gradient range mask for the
// active layer. The PNG itself encodes the color ramp; the overlay just
// drapes it over the field bounds at the chosen opacity.
const RangeImageOverlay: React.FC<{
  coordinates: number[][];
  base64Data: string;
  opacity: number;
}> = ({ coordinates, base64Data, opacity }) => {
  const getBounds = (): L.LatLngBounds | null => {
    if (coordinates.length === 0) return null;

    const leafletCoords: [number, number][] = coordinates
      .filter(
        (coord): coord is [number, number] =>
          Array.isArray(coord) && coord.length >= 2
      )
      .map(coord => [coord[1], coord[0]]);

    if (leafletCoords.length === 0) return null;

    const lats = leafletCoords.map(coord => coord[0]);
    const lngs = leafletCoords.map(coord => coord[1]);

    const southWest = L.latLng(Math.min(...lats), Math.min(...lngs));
    const northEast = L.latLng(Math.max(...lats), Math.max(...lngs));
    return L.latLngBounds(southWest, northEast);
  };

  const bounds = getBounds();
  if (!bounds || !base64Data) return null;

  return (
    <ImageOverlay
      url={`data:image/png;base64,${base64Data}`}
      bounds={bounds}
      opacity={opacity}
    />
  );
};

// Component to handle image overlay bounds calculation
const HeatmapImageOverlays: React.FC<{
  coordinates: number[][];
  masks: MaskOverlay[];
  maskOpacity?: Record<string, number>;
  maskVisibility?: Record<string, boolean>;
}> = ({ coordinates, masks, maskOpacity = {}, maskVisibility = {} }) => {
  // Calculate bounds from coordinates
  const getBounds = (): L.LatLngBounds | null => {
    if (coordinates.length === 0) return null;

    const leafletCoords: [number, number][] = coordinates
      .filter(
        (coord): coord is [number, number] =>
          Array.isArray(coord) && coord.length >= 2
      )
      .map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]

    if (leafletCoords.length === 0) return null;

    const lats = leafletCoords.map(coord => coord[0]);
    const lngs = leafletCoords.map(coord => coord[1]);

    const southWest = L.latLng(Math.min(...lats), Math.min(...lngs));
    const northEast = L.latLng(Math.max(...lats), Math.max(...lngs));

    return L.latLngBounds(southWest, northEast);
  };

  const bounds = getBounds();

  if (!bounds) return null;

  return (
    <>
      {masks.map(mask => {
        const opacity = maskOpacity[mask.id] ?? mask.opacity;
        const isVisible = maskVisibility[mask.id] ?? mask.visible ?? true;
        return (
          isVisible &&
          mask.base64Data && (
            <ImageOverlay
              key={mask.id}
              url={`data:image/png;base64,${mask.base64Data}`}
              bounds={bounds}
              opacity={opacity}
            />
          )
        );
      })}
    </>
  );
};

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  coordinates,
  heatmapData,
  height = '400px',
  className = '',
  activeLayer: activeLayerProp,
  maskOpacity = {},
  maskVisibility = {},
  anomalyTileUrl,
  focusRequestId,
  viewMode = 'masks',
  rangeOpacity = 0.7,
}) => {
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>(
    'hybrid'
  );
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const activeLayer = activeLayerProp ?? 'ndvi';
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Independent mask state for each layer
  const [ndviMasks, setNdviMasks] =
    useState<MaskOverlay[]>(createNdviMaskSet());
  const [ndwiMasks, setNdwiMasks] =
    useState<MaskOverlay[]>(createNdwiMaskSet());
  const [ndreMasks, setNdreMasks] =
    useState<MaskOverlay[]>(createNdreMaskSet());

  // Helpers to get the active layer's masks
  const masksMap: Partial<Record<LayerType, MaskOverlay[]>> = {
    ndvi: ndviMasks,
    ndwi: ndwiMasks,
    ndre: ndreMasks,
  };

  const activeMasks = masksMap[activeLayer] ?? [];

  // Update all mask sets when heatmap data changes
  useEffect(() => {
    if (!heatmapData) return;

    // NDVI masks (red, yellow, green)
    if (heatmapData.masks) {
      setNdviMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'red'
              ? heatmapData.masks.red_mask_base64
              : mask.id === 'yellow'
                ? heatmapData.masks.yellow_mask_base64
                : mask.id === 'green'
                  ? heatmapData.masks.green_mask_base64
                  : mask.base64Data,
        }))
      );
    }

    // NDWI masks (brown, yellow, light_blue)
    if (heatmapData['ndwi-masks']) {
      const ndwiData = heatmapData['ndwi-masks'];
      setNdwiMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'brown'
              ? (ndwiData.brown_mask_base64 ?? '')
              : mask.id === 'yellow'
                ? (ndwiData.yellow_mask_base64 ?? '')
                : mask.id === 'light_blue'
                  ? (ndwiData.light_blue_mask_base64 ?? '')
                  : mask.base64Data,
        }))
      );
    }

    // NDRE masks (purple, pink, light_green, dark_green)
    if (heatmapData['ndre-masks']) {
      const ndreData = heatmapData['ndre-masks'];
      setNdreMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'purple'
              ? (ndreData.purple_mask_base64 ?? '')
              : mask.id === 'pink'
                ? (ndreData.pink_mask_base64 ?? '')
                : mask.id === 'light_green'
                  ? (ndreData.light_green_mask_base64 ?? '')
                  : mask.id === 'dark_green'
                    ? (ndreData.dark_green_mask_base64 ?? '')
                    : mask.base64Data,
        }))
      );
    }
  }, [heatmapData]);

  // Convert coordinates to Leaflet format [lat, lng]
  const leafletCoords: [number, number][] = Array.isArray(coordinates)
    ? coordinates
        .filter(
          (coord): coord is [number, number] =>
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === 'number' &&
            typeof coord[1] === 'number'
        )
        .map(coord => [coord[1], coord[0]])
    : [];

  // Calculate center of the polygon
  const getPolygonCenter = (): [number, number] => {
    if (leafletCoords.length === 0) {
      return [28.6139, 77.209]; // Default center
    }

    const latSum = leafletCoords.reduce(
      (sum: number, coord: [number, number]) => sum + coord[0],
      0
    );
    const lngSum = leafletCoords.reduce(
      (sum: number, coord: [number, number]) => sum + coord[1],
      0
    );
    return [latSum / leafletCoords.length, lngSum / leafletCoords.length];
  };

  // Calculate appropriate zoom level based on polygon bounds
  const getZoomLevel = (): number => {
    if (leafletCoords.length === 0) return 10;

    const lats = leafletCoords.map((coord: [number, number]) => coord[0]);
    const lngs = leafletCoords.map((coord: [number, number]) => coord[1]);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    if (maxRange > 1) return 8;
    if (maxRange > 0.1) return 10;
    return 14;
  };

  const mapStyles = {
    hybrid: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    satellite: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`,
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const fitToFarmBounds = () => {
    const map = mapRef.current;
    if (!map) return;

    if (leafletCoords.length > 2) {
      const bounds = L.latLngBounds(leafletCoords);
      map.flyToBounds(bounds.pad(0.2), {
        animate: true,
        duration: 0.8,
        maxZoom: 17,
      });
      return;
    }

    const center = getPolygonCenter();
    const zoom = getZoomLevel();
    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.8,
    });
  };

  const handleResetView = () => {
    fitToFarmBounds();
  };

  useEffect(() => {
    if (!focusRequestId) return;
    fitToFarmBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequestId]);

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, {
          animate: true,
          duration: 2,
        });
      },
      () => {
        // Ignore errors silently
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStyleChange = (style: 'hybrid' | 'satellite' | 'streets') => {
    setMapStyle(style);
    setShowStyleSelector(false);
  };

  const center = getPolygonCenter();
  const zoom = getZoomLevel();

  return (
    <div className={`relative ${className}`} style={{ zIndex: 1 }}>
      <div
        style={{ height }}
        className='w-full rounded-lg overflow-hidden border'
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          {/* Base Layer - Dynamic based on selected style */}
          <TileLayer
            key={mapStyle}
            url={mapStyles[mapStyle]}
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />

          {/* Scale Control */}
          <ScaleControl position='bottomleft' imperial={false} />

          {/* Farm Boundary Polygon */}
          {leafletCoords.length > 2 && (
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                fillOpacity: 0.1,
                fillColor: '#10b981',
              }}
            />
          )}

          {/* Heatmap Image Overlays — discrete masks for the active layer */}
          {heatmapData && activeLayer !== 'anomaly' && viewMode === 'masks' && (
            <HeatmapImageOverlays
              coordinates={coordinates}
              masks={activeMasks}
              maskOpacity={maskOpacity}
              maskVisibility={maskVisibility}
            />
          )}

          {/* Range gradient overlay for the active layer */}
          {heatmapData && activeLayer !== 'anomaly' && viewMode === 'range' && (
            <RangeImageOverlay
              coordinates={coordinates}
              base64Data={
                (activeLayer === 'ndvi'
                  ? heatmapData.masks?.range_mask_base64
                  : activeLayer === 'ndwi'
                    ? heatmapData['ndwi-masks']?.range_mask_base64
                    : activeLayer === 'ndre'
                      ? heatmapData['ndre-masks']?.range_mask_base64
                      : '') ?? ''
              }
              opacity={rangeOpacity}
            />
          )}

          {/* Anomaly Image Overlay - constrained to farm bounds */}
          {activeLayer === 'anomaly' && anomalyTileUrl && (
            <AnomalyImageOverlay
              coordinates={coordinates}
              anomalyTileUrl={anomalyTileUrl}
              opacity={maskOpacity?.anomaly ?? 0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className='absolute top-3 left-3 z-[1000] bg-white backdrop-blur-sm rounded-md shadow-lg border border-neutral-700'>
        <div className='p-2 space-y-1.5'>
          {/* Navigation Tools */}
          <button
            type='button'
            onClick={handleZoomIn}
            className='w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group'
            title='Zoom In'
          >
            <ZoomIn className='h-4 w-4 group-hover:scale-110 transition-transform' />
          </button>
          <button
            type='button'
            onClick={handleZoomOut}
            className='w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group'
            title='Zoom Out'
          >
            <ZoomOut className='h-4 w-4 group-hover:scale-110 transition-transform' />
          </button>
          <button
            type='button'
            onClick={handleResetView}
            className='w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group'
            title='Reset View'
          >
            <RotateCcw className='h-4 w-4 group-hover:scale-110 transition-transform' />
          </button>
          <button
            type='button'
            onClick={handleLocateMe}
            className='w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group'
            title='My Location'
          >
            <LocateFixed className='h-4 w-4 group-hover:scale-110 transition-transform' />
          </button>

          {/* Divider */}
          <div className='h-px bg-neutral-600 my-2'></div>

          {/* Map Style Toggle */}
          <button
            type='button'
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              showStyleSelector
                ? 'bg-gray-100 text-black'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title='Map Style'
          >
            <Layers className='h-4 w-4 group-hover:scale-110 transition-transform' />
          </button>

          {/* Heatmap Controls Toggle */}
          {heatmapData && (
            <button
              type='button'
              onClick={() => setShowStyleSelector(false)}
              className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group bg-white text-black hover:bg-gray-100`}
              title='Layer controls are now in bottom-left'
              disabled
            >
              <Settings className='h-4 w-4 group-hover:scale-110 transition-transform opacity-50' />
            </button>
          )}
        </div>

        {/* Map Style Selector */}
        {showStyleSelector && (
          <div className='absolute left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-neutral-700 py-1 min-w-[100px]'>
            <button
              type='button'
              onClick={() => handleStyleChange('hybrid')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'hybrid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Hybrid
            </button>
            <button
              type='button'
              onClick={() => handleStyleChange('satellite')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'satellite'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              type='button'
              onClick={() => handleStyleChange('streets')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'streets'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Streets
            </button>
          </div>
        )}
      </div>

      {/* Right Side Heatmap Controls Panel - REMOVED (moved to MapLayerSelector) */}
    </div>
  );
};
