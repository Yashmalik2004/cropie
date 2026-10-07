import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import { useHeatmap } from '../hooks/useHeatmap';
import { useWeatherCalendar } from '../hooks/useWeatherCalendar';
import { HeatmapOverlay } from '../components/map/HeatmapOverlay';
import { MapLayerSelector } from '../components/map/MapLayerSelector';
import { SidebarTabs } from '../components/sidebar/SidebarTabs';
import type { LayerType } from '../components/map/HeatmapOverlay';
import { ArrowLeft, Sprout, Lock } from 'lucide-react';
import type { Farm } from '@/types/farm';
import { toast } from 'robot-toast';
import {
  exportFarmDataAsCSV,
  generatePDFReport,
  createMapImagesZip,
  extractMapImagesFromHeatmapData,
} from '../services/exportService';

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isGuestMode } = useAuth();
  const { getFarmById, deleteFarm, loading, farms } = useFarms();
  const {
    heatmapData,
    loading: heatmapLoading,
    error: heatmapError,
    fetchHeatmapData,
  } = useHeatmap(id);
  const {
    calendarData,
    loading: calendarLoading,
    fetchCalendar,
  } = useWeatherCalendar();

  const [farm, setFarm] = React.useState<Farm | null>(null);
  const [hasInitiallyFetchedHeatmap, setHasInitiallyFetchedHeatmap] =
    React.useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('ndvi');
  const [mapFocusRequestId, setMapFocusRequestId] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [maskOpacity, setMaskOpacity] = useState<Record<string, number>>({
    red: 0.7,
    yellow: 0.7,
    green: 0.7,
    brown: 0.7,
    light_blue: 0.7,
    purple: 0.7,
    pink: 0.7,
    light_green: 0.7,
    dark_green: 0.7,
    anomaly: 0.7,
  });
  const [maskVisibility, setMaskVisibility] = useState<Record<string, boolean>>({
    red: true,
    yellow: true,
    green: true,
    brown: true,
    light_blue: true,
    purple: true,
    pink: true,
    light_green: true,
    dark_green: true,
  });
  const [viewMode, setViewMode] = useState<'masks' | 'range'>('masks');
  const [rangeOpacity, setRangeOpacity] = useState(0.7);

  // Set farm when farms are loaded
  useEffect(() => {
    if (!loading && id && farms.length > 0) {
      const foundFarm = getFarmById(id);
      setFarm(foundFarm ?? null);
    }
  }, [loading, id, getFarmById, farms]);

  // Fetch growing-season weather calendar when farm is loaded
  useEffect(() => {
    if (
      farm &&
      farm.coordinates &&
      farm.coordinates.length > 0 &&
      farm.plantingDate &&
      farm.harvestDate
    ) {
      const validCoords = farm.coordinates.filter(c => c.length >= 2);
      if (validCoords.length > 0) {
        const sumLng = validCoords.reduce((s, c) => s + (c[0] ?? 0), 0);
        const sumLat = validCoords.reduce((s, c) => s + (c[1] ?? 0), 0);
        const lat = sumLat / validCoords.length;
        const lon = sumLng / validCoords.length;
        const plantStr = farm.plantingDate.slice(0, 10);
        const harvestStr = farm.harvestDate.slice(0, 10);
        fetchCalendar(lat, lon, plantStr, harvestStr);
      }
    }
  }, [farm, fetchCalendar]);

  // Fetch heatmap data when farm is loaded (only once)
  useEffect(() => {
    if (
      farm &&
      farm.coordinates &&
      farm.coordinates.length > 0 &&
      !hasInitiallyFetchedHeatmap &&
      !heatmapData
    ) {
      const coordinates = farm.coordinates
        .filter(coord => coord.length >= 2)
        .map(coord => [coord[0]!, coord[1]!]);
      if (coordinates.length > 0) {
        fetchHeatmapData(
          coordinates,
          0.5,
          0.75,
          farm.plantingDate,
          farm.harvestDate,
          farm.crop
        );
        setHasInitiallyFetchedHeatmap(true);
      }
    }
  }, [farm, fetchHeatmapData, hasInitiallyFetchedHeatmap, heatmapData]);

  // Show error toast when heatmap error occurs
  useEffect(() => {
    if (heatmapError) {
      toast.error({
        message: heatmapError,
        robotVariant: '/wheat-error.png',
        autoClose: 3000,
      });
    }
  }, [heatmapError]);

  // Show loader if loading or farms not loaded
  if (loading || !id || farms.length === 0) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card p-8 flex flex-col items-center space-y-6 animate-in'>
          <div className='relative'>
            <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <Sprout className='h-5 w-5 text-primary-600 animate-pulse' />
            </div>
          </div>
          <div className='text-center'>
            <p className='text-lg font-medium text-neutral-900 mb-2'>
              Loading Farm Details
            </p>
            <p className='text-sm text-neutral-600'>Gathering information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show 'Farm Not Found' only if farms loaded and farm missing
  if (!farm && id && farms.length > 0 && !loading) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card-elevated p-8 text-center max-w-md animate-in'>
          <div className='mb-6'>
            <div className='h-16 w-16 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-2xl flex items-center justify-center mx-auto'>
              <Sprout className='h-8 w-8 text-white' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-neutral-900 mb-3'>
            Farm Not Found
          </h2>
          <p className='text-neutral-600 mb-6 leading-relaxed'>
            The farm you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to='/dashboard'
            className='btn-primary inline-flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isGuestFarm =
    (farm as unknown as { isGuest?: boolean })?.isGuest === true;
  const canView =
    user?.role === 'admin' ||
    farm?.userId === user?.id ||
    isGuestFarm ||
    isGuestMode;
  const canEdit =
    user?.role === 'admin' ||
    farm?.userId === user?.id ||
    (isGuestFarm && isGuestMode);

  if (!canView) {
    return (
      <div className='min-h-screen gradient-mesh flex items-center justify-center'>
        <div className='card-elevated p-8 text-center max-w-md animate-in'>
          <div className='mb-6'>
            <div className='h-16 w-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-glow-red'>
              <Lock className='h-8 w-8 text-white' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-neutral-900 mb-3'>
            Access Denied
          </h2>
          <p className='text-neutral-600 mb-6 leading-relaxed'>
            You don't have permission to view this farm.
          </p>
          <Link
            to='/dashboard'
            className='btn-primary inline-flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${farm?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteFarm(farm?.id || '');
        toast.success({
          message: 'Farm deleted successfully!',
          robotVariant: '/wheat-base.png',
          autoClose: 3000,
        });
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (error) {
        console.error('Error deleting farm:', error);
      }
    }
  };

  const handleOpacityChange = (maskId: string, opacity: number) => {
    setMaskOpacity(prev => ({
      ...prev,
      [maskId]: opacity,
    }));
  };

  const handleVisibilityChange = (maskId: string, visible: boolean) => {
    setMaskVisibility(prev => ({
      ...prev,
      [maskId]: visible,
    }));
  };

  const anomalyTileUrl = heatmapData?.anomaly?.tile_urls?.anomaly_heatmap;

  // Pick the gradient meta for whichever layer is active. Anomaly has its
  // own overlay/legend so it falls through to null and the toggle is hidden.
  const activeRangeMeta =
    activeLayer === 'ndvi'
      ? (heatmapData?.masks?.range_meta ?? null)
      : activeLayer === 'ndwi'
        ? (heatmapData?.['ndwi-masks']?.range_meta ?? null)
        : activeLayer === 'ndre'
          ? (heatmapData?.['ndre-masks']?.range_meta ?? null)
          : null;

  return (
    <div className='flex h-screen bg-neutral-900 overflow-hidden'>
      {/* Back Button (fixed top-left, above map) */}
      <Link
        to='/dashboard'
        className='absolute top-4 left-4 z-50 p-2.5 rounded-lg bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all shadow-lg'
        title='Back to Dashboard'
      >
        <ArrowLeft className='h-5 w-5' />
      </Link>

      {/* Full-Window Map */}
      <div className='flex-1 relative' ref={mapContainerRef}>
        <HeatmapOverlay
          coordinates={farm?.coordinates || [[]]}
          heatmapData={heatmapData}
          height='100vh'
          className='w-full'
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          maskOpacity={maskOpacity}
          maskVisibility={maskVisibility}
          anomalyTileUrl={anomalyTileUrl}
          focusRequestId={mapFocusRequestId}
          viewMode={viewMode}
          rangeOpacity={rangeOpacity}
        />

        {/* Map Layer Selector (Bottom-Left) */}
        {!heatmapLoading && (
          <MapLayerSelector
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            maskOpacity={maskOpacity}
            onOpacityChange={handleOpacityChange}
            maskVisibility={maskVisibility}
            onVisibilityChange={handleVisibilityChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            rangeOpacity={rangeOpacity}
            onRangeOpacityChange={setRangeOpacity}
            rangeMeta={activeRangeMeta}
          />
        )}

        {/* Error Banner removed - now using toast notifications */}
      </div>

      {/* Right Sidebar */}
      <div className='flex h-full overflow-hidden'>
        {farm ? (
          <SidebarTabs
            farm={farm}
            heatmapData={heatmapData ?? null}
            heatmapLoading={heatmapLoading}
            weatherCalendarData={calendarData}
            canEdit={canEdit}
            onDelete={handleDelete}
            onViewFarmOnMap={() => setMapFocusRequestId(prev => prev + 1)}
            onViewStressMap={() => {
              setActiveLayer('anomaly');
              setMapFocusRequestId(prev => prev + 1);
            }}
            onRefreshWeather={() => {
              if (farm && farm.coordinates && farm.coordinates.length > 0) {
                const validCoords = farm.coordinates.filter(c => c.length >= 2);
                if (validCoords.length > 0) {
                  const sumLng = validCoords.reduce(
                    (s, c) => s + (c[0] ?? 0),
                    0
                  );
                  const sumLat = validCoords.reduce(
                    (s, c) => s + (c[1] ?? 0),
                    0
                  );
                  const lat = sumLat / validCoords.length;
                  const lon = sumLng / validCoords.length;
                  const plantStr = farm.plantingDate.slice(0, 10);
                  const harvestStr = farm.harvestDate.slice(0, 10);
                  fetchCalendar(lat, lon, plantStr, harvestStr);
                }
              }
            }}
            onExportData={async () => {
              try {
                setExportLoading(true);
                exportFarmDataAsCSV(farm, heatmapData);
                toast.success('Farm data exported successfully');
              } catch (error) {
                console.error('Export failed:', error);
                toast.error('Failed to export farm data');
              } finally {
                setExportLoading(false);
              }
            }}
            onGenerateReport={async () => {
              try {
                setExportLoading(true);
                await generatePDFReport(farm, heatmapData);
                toast.success('Report generated successfully');
              } catch (error) {
                console.error('Report generation failed:', error);
                toast.error('Failed to generate report');
              } finally {
                setExportLoading(false);
              }
            }}
            onDownloadMap={async () => {
              try {
                setExportLoading(true);
                if (!farm) {
                  toast.error('Farm not ready');
                  return;
                }
                if (!heatmapData) {
                  toast.error('Heatmap data not loaded yet');
                  return;
                }
                // Pull every mask/range/anomaly PNG straight from the
                // backend response. No leaflet manipulation, no on-screen
                // layer flipping - the user keeps whichever view they
                // were on while the zip is built.
                const mapImages = extractMapImagesFromHeatmapData(heatmapData);
                if (mapImages.length === 0) {
                  toast.error('No map images available to download');
                  return;
                }
                await createMapImagesZip(mapImages, farm.name);
                toast.success(`Downloaded ${mapImages.length} map images`);
              } catch (error) {
                console.error('Map download failed:', error);
                toast.error('Failed to download map images');
              } finally {
                setExportLoading(false);
              }
            }}
            weatherLoading={calendarLoading}
            exportLoading={exportLoading}
          />
        ) : null}
      </div>
    </div>
  );
}
