import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Maximum allowed area in hectares (100 km² = 10,000 hectares)
const MAX_AREA_HECTARES = parseInt(import.meta.env.VITE_MAX_AREA_HECTARES || "10000");
// Set Mapbox access token from environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNsZXhhbXBsZSJ9.example';

interface InteractiveMapProps {
    onPolygonComplete?: (coordinates: number[][], area: number) => void;
    initialCoordinates?: number[][];
    height?: string;
    className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
    onPolygonComplete,
    initialCoordinates,
    height = '400px',
    className = ''
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
    const [polygonSource, setPolygonSource] = useState<mapboxgl.GeoJSONSource | null>(null);

    const updatePolygonDisplay = useCallback((coordinates: number[][]) => {
        if (!polygonSource) return;

        const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'Polygon' as const,
                coordinates: coordinates.length > 2 ? [coordinates] : [[]]
            }
        };

        polygonSource.setData(geojson);
    }, [polygonSource]);

    useEffect(() => {
        if (!mapContainer.current) return;

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [
                Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LNG) || 77.2090,
                Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT) || 28.6139
            ], // Default to Delhi, India
            zoom: 10
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add drawing controls
        const drawingControls = document.createElement('div');
        drawingControls.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        drawingControls.innerHTML = `
      <button id="draw-polygon" class="mapboxgl-ctrl-icon" title="Draw Polygon">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M2 2 L18 2 L18 18 L2 18 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button id="clear-polygon" class="mapboxgl-ctrl-icon" title="Clear Polygon">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M6 6 L14 14 M14 6 L6 14" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    `;

        map.current.addControl({
            onAdd: () => drawingControls,
            onRemove: () => { }
        } as mapboxgl.IControl, 'top-left');

        // Wait for map to load
        map.current.on('load', () => {
            if (!map.current) return;

            // Add polygon source and layer
            map.current.addSource('polygon', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[]]
                    }
                }
            });

            map.current.addLayer({
                id: 'polygon-fill',
                type: 'fill',
                source: 'polygon',
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.3
                }
            });

            map.current.addLayer({
                id: 'polygon-stroke',
                type: 'line',
                source: 'polygon',
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2
                }
            });

            setPolygonSource(map.current.getSource('polygon') as mapboxgl.GeoJSONSource);

            // Load initial coordinates if provided
            if (initialCoordinates && initialCoordinates.length > 0) {
                setCurrentPolygon(initialCoordinates);
                updatePolygonDisplay(initialCoordinates);
            }
        });

        // Drawing event handlers
        const handleDrawPolygon = () => {
            setIsDrawing(true);
            setCurrentPolygon([]);
            if (map.current) {
                map.current.getCanvas().style.cursor = 'crosshair';
            }
        };

        const handleClearPolygon = () => {
            setIsDrawing(false);
            setCurrentPolygon([]);
            updatePolygonDisplay([]);
            if (map.current) {
                map.current.getCanvas().style.cursor = '';
            }
        };

        const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
            if (!isDrawing) return;

            const newPoint: number[] = [e.lngLat.lng, e.lngLat.lat];
            const newPolygon = [...currentPolygon, newPoint];
            setCurrentPolygon(newPolygon);
            updatePolygonDisplay(newPolygon);
        };

        const handleMapDoubleClick = (e: mapboxgl.MapMouseEvent) => {
            if (!isDrawing || currentPolygon.length < 3) return;

            e.preventDefault();
            
            // Calculate area and check limit before completing
            const area = calculatePolygonArea(currentPolygon);
            if (area > MAX_AREA_HECTARES) {
                alert(`Area too large! Maximum allowed: ${MAX_AREA_HECTARES.toLocaleString()} hectares (${area.toLocaleString()} hectares selected)`);
                setIsDrawing(false);
                setCurrentPolygon([]);
                updatePolygonDisplay([]);
                if (map.current) {
                    map.current.getCanvas().style.cursor = '';
                }
                return;
            }
            
            setIsDrawing(false);

            // Close the polygon
            const firstPoint = currentPolygon[0];
            if (firstPoint) {
                const closedPolygon = [...currentPolygon, firstPoint];
                setCurrentPolygon(closedPolygon);
                updatePolygonDisplay(closedPolygon);
            }

            if (map.current) {
                map.current.getCanvas().style.cursor = '';
            }

            // Notify parent
            if (onPolygonComplete) {
                onPolygonComplete(currentPolygon, area);
            }
        };

        // Add event listeners
        drawingControls.querySelector('#draw-polygon')?.addEventListener('click', handleDrawPolygon);
        drawingControls.querySelector('#clear-polygon')?.addEventListener('click', handleClearPolygon);

        if (map.current) {
            map.current.on('click', handleMapClick);
            map.current.on('dblclick', handleMapDoubleClick);
        }

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, [currentPolygon, initialCoordinates, isDrawing, onPolygonComplete, updatePolygonDisplay]);

    const calculatePolygonArea = (coordinates: number[][]): number => {
        if (coordinates.length < 3) return 0;

        let area = 0;
        const n = coordinates.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const currentPoint = coordinates[i];
            const nextPoint = coordinates[j];

            if (currentPoint && nextPoint &&
                currentPoint.length >= 2 && nextPoint.length >= 2 &&
                typeof currentPoint[0] === 'number' && typeof currentPoint[1] === 'number' &&
                typeof nextPoint[0] === 'number' && typeof nextPoint[1] === 'number') {
                area += currentPoint[0] * nextPoint[1];
                area -= nextPoint[0] * currentPoint[1];
            }
        }

        area = Math.abs(area) / 2;

        // Convert from square degrees to hectares (approximate)
        const hectares = area * 111320 * 111320 / 10000;
        return Math.round(hectares * 100) / 100;
    };

    return (
        <div className={`relative ${className}`} style={{zIndex: 1}}>
            <div
                ref={mapContainer}
                style={{ height }}
                className="w-full rounded-lg overflow-hidden"
            />

            {isDrawing && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                    Click to add points, double-click to finish
                </div>
            )}

            {currentPolygon.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-sm">
                    <div>Points: {currentPolygon.length}</div>
                    {currentPolygon.length > 2 && (() => {
                        const area = calculatePolygonArea(currentPolygon);
                        const isOverLimit = area > MAX_AREA_HECTARES;
                        const isNearLimit = area > MAX_AREA_HECTARES * 0.8;
                        
                        return (
                            <>
                                <div className={isOverLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}>
                                    Area: {area} hectares
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
        </div>
    );
};