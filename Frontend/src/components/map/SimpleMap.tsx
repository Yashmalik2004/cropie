import { formatHectares } from '@/utils';
import React, { useState } from 'react';

// Maximum allowed area in hectares (100 km² = 10,000 hectares)
const MAX_AREA_HECTARES = parseInt(import.meta.env.VITE_MAX_AREA_HECTARES || "1000000");

interface SimpleMapProps {
  onPolygonComplete?: (coordinates: number[][], area: number) => void;
  initialCoordinates?: number[][];
  height?: string;
  className?: string;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({
  onPolygonComplete,
  initialCoordinates = [],
  height = '400px',
  className = ''
}) => {
  const [coordinates, setCoordinates] = useState<number[][]>(initialCoordinates);
  const [isDrawing, setIsDrawing] = useState(false);

  // Simple area calculation (approximate)
  const calculateArea = (coords: number[][]): number => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    const n = coords.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const currentPoint = coords[i];
      const nextPoint = coords[j];
      
      if (currentPoint && nextPoint && 
          currentPoint.length >= 2 && nextPoint.length >= 2 &&
          typeof currentPoint[0] === 'number' && typeof currentPoint[1] === 'number' &&
          typeof nextPoint[0] === 'number' && typeof nextPoint[1] === 'number') {
        area += currentPoint[0] * nextPoint[1];
        area -= nextPoint[0] * currentPoint[1];
      }
    }
    
    area = Math.abs(area) / 2;
    // Rough conversion to hectares
    const hectares = area * 111320 * 111320 / 10000;
    return Math.round(hectares * 100) / 100;
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setCoordinates([]);
  };

  const handleClearDrawing = () => {
    setIsDrawing(false);
    setCoordinates([]);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to approximate lat/lng (demo purposes)
    const lng = 77.2090 + (x - rect.width / 2) * 0.001;
    const lat = 28.6139 + (rect.height / 2 - y) * 0.001;
    
    const newCoords = [...coordinates, [lng, lat]];
    setCoordinates(newCoords);
  };

  const handleFinishDrawing = () => {
    if (coordinates.length < 3) {
      alert('Please add at least 3 points to create a polygon');
      return;
    }

    // Check area limit before completing
    const area = calculateArea(coordinates);
    if (area > MAX_AREA_HECTARES) {
      alert(`Area too large! Maximum allowed: ${MAX_AREA_HECTARES.toLocaleString()} hectares (${area.toLocaleString()} hectares selected)`);
      handleClearDrawing();
      return;
    }

    setIsDrawing(false);
    if (onPolygonComplete) {
      onPolygonComplete(coordinates, area);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ zIndex: 1 }}>
      {/* Map Container */}
      <div 
        style={{ height }} 
        className="w-full bg-green-100 border-2 border-dashed border-green-300 rounded-lg cursor-crosshair relative overflow-hidden"
        onClick={handleMapClick}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-green-200"></div>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-green-600">
            <div className="text-4xl mb-2">🗺️</div>
            <div className="text-sm font-medium">Interactive Map</div>
            <div className="text-xs text-green-500 mt-1">
              {isDrawing ? 'Click to add points' : 'Click "Draw Polygon" to start'}
            </div>
          </div>
        </div>

        {/* Drawn Points */}
        {coordinates.map((coord, index) => {
          if (!coord || coord.length < 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            return null;
          }
          
          const x = (coord[0] - 77.2090) / 0.001 + 250; // Convert back to pixels
          const y = 200 - (coord[1] - 28.6139) / 0.001;
          
          return (
            <div
              key={index}
              className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-blue-500 text-white px-1 rounded">
                {index + 1}
              </div>
            </div>
          );
        })}

        {/* Polygon Lines */}
        {coordinates.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={coordinates
                .filter(coord => coord && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
                .map(coord => {
                    if (!coord || coord.length < 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                        return null;
                      }
                  const x = (coord[0] - 77.2090) / 0.001 + 250;
                  const y = 200 - (coord[1] - 28.6139) / 0.001;
                  return `${x},${y}`;
                }).join(' ')}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        {!isDrawing ? (
          <button
            onClick={handleStartDrawing}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 shadow-lg"
          >
            📐 Draw Polygon
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleFinishDrawing}
              disabled={coordinates.length < 3}
              className="block px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              ✓ Finish ({coordinates.length} points)
            </button>
            <button
              onClick={handleClearDrawing}
              className="block px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 shadow-lg"
            >
              🗑️ Clear
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      {coordinates.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <div className="font-medium">Points: {coordinates.length}</div>
          {coordinates.length > 2 && (() => {
            const area = calculateArea(coordinates);
            const isOverLimit = area > MAX_AREA_HECTARES;
            const isNearLimit = area > MAX_AREA_HECTARES * 0.8;
            
            return (
              <>
                <div className={isOverLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}>
                  Area: {formatHectares(area)} hectares
                </div>
                {isOverLimit && (
                  <div className="text-red-600 text-xs mt-1 font-medium">
                    ⚠️ Exceeds limit ({MAX_AREA_HECTARES.toLocaleString()} ha max)
                  </div>
                )}
                {isNearLimit && !isOverLimit && (
                  <div className="text-orange-600 text-xs mt-1">
                    ⚠️ Approaching limit ({MAX_AREA_HECTARES.toLocaleString()} ha max)
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      {isDrawing && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
          <div className="font-medium mb-1">Drawing Mode</div>
          <div className="text-xs">
            • Click to add points<br/>
            • Need at least 3 points<br/>
            • Click "Finish" when done
          </div>
        </div>
      )}
    </div>
  );
};