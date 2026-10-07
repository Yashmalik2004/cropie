import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, ScaleControl, Rectangle, Polygon, Polyline, CircleMarker } from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';
import { Square, ZoomIn, ZoomOut, Layers, RotateCcw, LocateFixed, RectangleHorizontal, Pentagon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './map.css';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type DrawMode = 'none' | 'square' | 'rectangle' | 'polygon';

interface LeafletMapProps {
  onPolygonComplete?: (coordinates: number[][], area: number) => void;
  height?: string;
  className?: string;
  initialPolygon?: number[][];
  allowPolygon?: boolean;
}

// Calculate area in hectares from [lng, lat] coordinates using the Shoelace formula
const calculateAreaHectares = (coords: number[][]): number => {
  if (coords.length < 3) return 0;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ci = coords[i]!;
    const cj = coords[j]!;
    area += ci[0]! * cj[1]!;
    area -= cj[0]! * ci[1]!;
  }
  area = Math.abs(area) / 2;
  // Average lat for longitude scaling
  const avgLat = coords.reduce((s, c) => s + (c[1] ?? 0), 0) / n;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(avgLat * Math.PI / 180);
  return (area * metersPerDegreeLat * metersPerDegreeLng) / 10000;
};

// --- Drawing handler component ---
interface DrawingControlsProps {
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  onShapeComplete: (coordinates: number[][], area: number, shapeType?: string) => void;
  // Square
  setSquareBounds: (bounds: [[number, number], [number, number]] | null) => void;
  // Rectangle
  rectStart: [number, number] | null;
  setRectStart: (p: [number, number] | null) => void;
  setRectEnd: (p: [number, number] | null) => void;
  // Polygon
  polygonPoints: [number, number][];
  setPolygonPoints: (pts: [number, number][]) => void;
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  drawMode,
  setDrawMode,
  onShapeComplete,
  setSquareBounds,
  rectStart,
  setRectStart,
  setRectEnd,
  polygonPoints,
  setPolygonPoints,
}) => {
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs to avoid stale closures in map event handlers
  const polygonPointsRef = useRef(polygonPoints);
  polygonPointsRef.current = polygonPoints;
  const onShapeCompleteRef = useRef(onShapeComplete);
  onShapeCompleteRef.current = onShapeComplete;
  const rectStartRef = useRef(rectStart);
  rectStartRef.current = rectStart;

  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (drawMode === 'square') {
        const centerLat = e.latlng.lat;
        const centerLng = e.latlng.lng;
        const sideLengthKm = Math.sqrt(10);
        const latDegreesPerKm = 1 / 111.32;
        const lngDegreesPerKm = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));
        const latOffset = (sideLengthKm / 2) * latDegreesPerKm;
        const lngOffset = (sideLengthKm / 2) * lngDegreesPerKm;
        const bounds: [[number, number], [number, number]] = [
          [centerLat - latOffset, centerLng - lngOffset],
          [centerLat + latOffset, centerLng + lngOffset],
        ];
        setSquareBounds(bounds);
        setDrawMode('none');
        const squareCoords = [
          [bounds[0][1], bounds[0][0]],
          [bounds[1][1], bounds[0][0]],
          [bounds[1][1], bounds[1][0]],
          [bounds[0][1], bounds[1][0]],
          [bounds[0][1], bounds[0][0]],
        ];
        onShapeCompleteRef.current(squareCoords, 1000, '10km² Square');
      } else if (drawMode === 'rectangle') {
        const rs = rectStartRef.current;
        if (!rs) {
          setRectStart([e.latlng.lat, e.latlng.lng]);
        } else {
          const end: [number, number] = [e.latlng.lat, e.latlng.lng];
          setRectEnd(end);
          setDrawMode('none');
          const coords = [
            [rs[1], rs[0]],
            [end[1], rs[0]],
            [end[1], end[0]],
            [rs[1], end[0]],
            [rs[1], rs[0]],
          ];
          const area = calculateAreaHectares(coords);
          onShapeCompleteRef.current(coords, Math.round(area * 100) / 100, 'Rectangle');
        }
      } else if (drawMode === 'polygon') {
        // Debounce click to avoid adding points on double-click
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
        clickTimerRef.current = setTimeout(() => {
          setPolygonPoints([...polygonPointsRef.current, point]);
        }, 250);
      }
    },
    mousemove: (e: LeafletMouseEvent) => {
      if (drawMode === 'rectangle' && rectStartRef.current) {
        setRectEnd([e.latlng.lat, e.latlng.lng]);
      }
    },
    dblclick: (e: LeafletMouseEvent) => {
      if (drawMode === 'polygon') {
        // Cancel the pending click so no extra point is added
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
        const pts = polygonPointsRef.current;
        if (pts.length >= 3) {
          const first = pts[0]!;
          const closed = [...pts, first];
          const coords = closed.map((p) => [p[1], p[0]]);
          const area = calculateAreaHectares(coords);
          setDrawMode('none');
          onShapeCompleteRef.current(coords, Math.round(area * 100) / 100, 'Polygon');
        }
      }
    },
  });

  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  onPolygonComplete,
  height = '400px',
  className = '',
  initialPolygon,
  allowPolygon = true,
}) => {
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>('none');

  // Shape state
  const [squareBounds, setSquareBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);
  const [rectBounds, setRectBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [completedPolygon, setCompletedPolygon] = useState<[number, number][] | null>(() => {
    if (initialPolygon && initialPolygon.length >= 3) {
      // Convert from [lng, lat] to [lat, lng] for Leaflet
      return initialPolygon.map(([lng, lat]) => [lat, lng] as [number, number]);
    }
    return null;
  });

  // Result state
  const [shapeInfo, setShapeInfo] = useState<{ label: string; area: number } | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;


  // Clear all shapes
  const clearShapes = () => {
    setSquareBounds(null);
    setRectStart(null);
    setRectEnd(null);
    setRectBounds(null);
    setPolygonPoints([]);
    setCompletedPolygon(null);
    setShapeInfo(null);
  };

  // Initialize map view to fit initial polygon bounds
  React.useEffect(() => {
    if (initialPolygon && initialPolygon.length > 0 && mapRef.current) {
      // Calculate bounds from polygon coordinates
      const lats = initialPolygon.map(c => c[1]).filter((val): val is number => typeof val === 'number');
      const lngs = initialPolygon.map(c => c[0]).filter((val): val is number => typeof val === 'number');
      
      if (lats.length === 0 || lngs.length === 0) return;
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const bounds: L.LatLngBoundsExpression = [
        [minLat, minLng],
        [maxLat, maxLng],
      ];
      
      // Fit bounds with some padding
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
      }, 100);
    }
  }, [initialPolygon]);

  const activateMode = (mode: DrawMode) => {
    clearShapes();
    setDrawMode(mode === drawMode ? 'none' : mode);
    setShowStyleSelector(false);
  };

  const handleShapeComplete = useCallback(
    (coords: number[][], area: number, shapeType?: string) => {
      const label = shapeType || 'Shape';
      // For polygons, also store the completed polygon for rendering
      if (label === 'Polygon') {
        const leafletPts: [number, number][] = coords.map((c) => [c[1] as number, c[0] as number]);
        setCompletedPolygon(leafletPts);
        setPolygonPoints([]);
      }
      setShapeInfo({ label, area });
      onPolygonComplete?.(coords, area);
    },
    [onPolygonComplete]
  );

  // When rectangle completes, persist bounds
  const handleRectEnd = (end: [number, number] | null) => {
    setRectEnd(end);
    if (end && rectStart) {
      setRectBounds([
        [Math.min(rectStart[0], end[0]), Math.min(rectStart[1], end[1])],
        [Math.max(rectStart[0], end[0]), Math.max(rectStart[1], end[1])],
      ]);
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    mapRef.current?.setView(defaultCenter, Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10);
  };
  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 2 }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const handleStyleChange = (style: 'hybrid' | 'satellite' | 'streets') => {
    setMapStyle(style);
    setShowStyleSelector(false);
  };

  const mapStyles = {
    hybrid: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    satellite: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`,
  };

  const defaultCenter: [number, number] = [
    Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT) || 28.6139,
    Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LNG) || 77.2090,
  ];

  // Live preview rectangle bounds
  const previewRectBounds: [[number, number], [number, number]] | null =
    drawMode === 'rectangle' && rectStart && rectEnd
      ? [
          [Math.min(rectStart[0], rectEnd[0]), Math.min(rectStart[1], rectEnd[1])],
          [Math.max(rectStart[0], rectEnd[0]), Math.max(rectStart[1], rectEnd[1])],
        ]
      : null;

  const modeLabels: Record<DrawMode, string> = {
    none: '',
    square: 'Square Placement',
    rectangle: 'Rectangle Selection',
    polygon: 'Polygon Drawing',
  };

  const modeInstructions: Record<DrawMode, string[]> = {
    none: [],
    square: ['Click anywhere on the map', 'A 10km² square will be placed'],
    rectangle: ['Click to set the first corner', 'Click again to set the opposite corner'],
    polygon: ['Click to add vertices', 'Double-click to complete the shape', 'Minimum 3 points required'],
  };

  return (
    <div className={`relative ${className}`} style={{ zIndex: 1 }}>
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-neutral-200">
        <MapContainer
          center={defaultCenter}
          zoom={Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          doubleClickZoom={false}
          ref={mapRef}
        >
          <TileLayer
            key={mapStyle}
            url={mapStyles[mapStyle]}
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />
          <ScaleControl position="bottomleft" imperial={false} />

          <DrawingControls
            drawMode={drawMode}
            setDrawMode={setDrawMode}
            onShapeComplete={handleShapeComplete}
            setSquareBounds={setSquareBounds}
            rectStart={rectStart}
            setRectStart={setRectStart}
            setRectEnd={handleRectEnd}
            polygonPoints={polygonPoints}
            setPolygonPoints={setPolygonPoints}
          />

          {/* Square shape */}
          {squareBounds && (
            <Rectangle
              bounds={squareBounds}
              pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.2, fillColor: '#3b82f6' }}
            />
          )}

          {/* Rectangle preview while drawing */}
          {previewRectBounds && (
            <Rectangle
              bounds={previewRectBounds}
              pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.15, fillColor: '#8b5cf6', dashArray: '6 4' }}
            />
          )}

          {/* Completed rectangle */}
          {rectBounds && drawMode === 'none' && (
            <Rectangle
              bounds={rectBounds}
              pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.2, fillColor: '#8b5cf6' }}
            />
          )}

          {/* Polygon preview while drawing */}
          {drawMode === 'polygon' && polygonPoints.length > 0 && (
            <>
              {polygonPoints.length >= 3 ? (
                <Polygon
                  positions={polygonPoints}
                  pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.1, fillColor: '#10b981', dashArray: '6 4' }}
                />
              ) : (
                <Polyline
                  positions={polygonPoints}
                  pathOptions={{ color: '#10b981', weight: 2, dashArray: '6 4' }}
                />
              )}
              {polygonPoints.map((pt, i) => (
                <CircleMarker
                  key={i}
                  center={pt}
                  radius={5}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: '#10b981', fillOpacity: 1 }}
                />
              ))}
            </>
          )}

          {/* Completed polygon */}
          {completedPolygon && (
            <Polygon
              positions={completedPolygon}
              pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.2, fillColor: '#10b981' }}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-white rounded-md shadow-lg border border-neutral-700">
        <div className="p-2 space-y-1.5">
          {/* Square */}
          <button
            type="button"
            onClick={() => activateMode('square')}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              drawMode === 'square' ? 'bg-blue-100 text-blue-600' : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Add 10km² Square"
          >
            <Square className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Rectangle */}
          <button
            type="button"
            onClick={() => activateMode('rectangle')}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              drawMode === 'rectangle' ? 'bg-violet-100 text-violet-600' : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Draw Rectangle"
          >
            <RectangleHorizontal className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Polygon */}
          {allowPolygon && (
            <button
              type="button"
              onClick={() => activateMode('polygon')}
              className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
                drawMode === 'polygon' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="Draw Polygon"
            >
              <Pentagon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <div className="border-t border-neutral-200 my-1" />

          {/* Navigation Tools */}
          <button type="button" onClick={handleZoomIn} className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group" title="Zoom In">
            <ZoomIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button type="button" onClick={handleZoomOut} className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group" title="Zoom Out">
            <ZoomOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button type="button" onClick={handleResetView} className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group" title="Reset View">
            <RotateCcw className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button type="button" onClick={handleLocateMe} className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group" title="My Location">
            <LocateFixed className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          <div className="border-t border-neutral-200 my-1" />

          {/* Map Style Toggle */}
          <button
            type="button"
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              showStyleSelector ? 'bg-gray-100 text-black' : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Map Style"
          >
            <Layers className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Map Style Selector */}
        {showStyleSelector && (
          <div className="absolute left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-neutral-700 py-1 min-w-[100px]">
            {(['hybrid', 'satellite', 'streets'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => handleStyleChange(style)}
                className={`w-full px-3 py-1.5 text-xs text-left transition-colors capitalize ${
                  mapStyle === style ? 'bg-gray-100 text-black' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Display */}
      {shapeInfo && (
        <div className="absolute bottom-3 right-3 bg-white text-black px-3 py-2 rounded-md shadow-lg border border-neutral-700 text-sm z-[1000]">
          <div className="font-medium text-black">{shapeInfo.label}</div>
          <div className="font-medium text-emerald-400">Area: {shapeInfo.area.toFixed(1)} ha</div>
        </div>
      )}

      {/* Instructions */}
      {drawMode !== 'none' && (
        <div className="absolute top-3 right-3 bg-white text-black px-4 py-3 rounded-md max-w-xs z-[1000] shadow-lg border border-neutral-700">
          <div className="font-medium mb-2 flex items-center text-black">
            {drawMode === 'square' && <Square className="h-4 w-4 mr-2 text-blue-500" />}
            {drawMode === 'rectangle' && <RectangleHorizontal className="h-4 w-4 mr-2 text-violet-500" />}
            {drawMode === 'polygon' && <Pentagon className="h-4 w-4 mr-2 text-emerald-500" />}
            {modeLabels[drawMode]}
          </div>
          <div className="text-xs leading-relaxed text-black">
            {modeInstructions[drawMode].map((line, i) => (
              <React.Fragment key={i}>• {line}<br /></React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
