import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { Layers, ZoomIn, ZoomOut, RotateCcw, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Maximum allowed area in hectares (100 km² = 10,000 hectares)
// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FarmMapViewProps {
  coordinates: number[][]; // Array of [lng, lat] pairs
  farmName: string;
  height?: string;
  className?: string;
}

export const FarmMapView: React.FC<FarmMapViewProps> = ({
  coordinates,
  height = '400px',
  className = ''
}) => {
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Convert coordinates to Leaflet format [lat, lng]
  // coordinates: number[][] is expected as [lng, lat] pairs
  const leafletCoords: [number, number][] = Array.isArray(coordinates)
    ? coordinates
        .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
        .map((coord) => [coord[1], coord[0]])
    : [];

  // Calculate center of the polygon
  const getPolygonCenter = (): [number, number] => {
    if (leafletCoords.length === 0) {
      return [28.6139, 77.2090]; // Default center
    }

    const latSum = leafletCoords.reduce((sum: number, coord: [number, number]) => sum + coord[0], 0);
    const lngSum = leafletCoords.reduce((sum: number, coord: [number, number]) => sum + coord[1], 0);
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

    // Rough zoom calculation
    if (maxRange > 1) return 8;
    if (maxRange > 0.1) return 10;
    if (maxRange > 0.01) return 12;
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

  const handleResetView = () => {
    if (mapRef.current) {
      const center = getPolygonCenter();
      const zoom = getZoomLevel();
      mapRef.current.setView(center, zoom);
    }
  };

  const handleLocateMe = () => {
  const map = mapRef.current;
  if (!map) return;

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.flyTo([latitude, longitude], 16, {
        animate: true,
        duration: 2 // seconds
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
    <div className={`relative ${className}`} style={{zIndex:1}}>
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
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
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Farm Boundary Polygon */}
          {leafletCoords.length > 2 && (
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                fillOpacity: 0.2,
                fillColor: '#10b981'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-white backdrop-blur-sm rounded-md shadow-lg border border-neutral-700">
        <div className="p-2 space-y-1.5">
          {/* Navigation Tools */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="My Location"
          >
            <LocateFixed className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Divider */}
          <div className="h-px bg-neutral-600 my-2"></div>

          {/* Map Style Toggle */}
          <button
            type="button"
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              showStyleSelector 
                ? 'bg-gray-100 text-black' 
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Map Style"
          >
            <Layers className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Map Style Selector */}
        {showStyleSelector && (
          <div className="absolute left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-neutral-700 py-1 min-w-[100px]">
            <button
              type="button"
              onClick={() => handleStyleChange('hybrid')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'hybrid' 
                  ? 'bg-white text-black' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('satellite')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'satellite' 
                  ? 'bg-white text-black' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('streets')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'streets' 
                  ? 'bg-white text-black' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Streets
            </button>
          </div>
        )}
      </div>
    </div>
  );
};