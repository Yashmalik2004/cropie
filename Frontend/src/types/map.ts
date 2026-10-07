export interface MapState {
  center: [number, number];
  zoom: number;
  selectedLayer: 'satellite' | 'hybrid' | 'streets' | 'terrain';
  drawnShapes: GeoJSON.Feature[];
  overlays: HealthOverlay[];
  isDrawing: boolean;
}

export interface HealthOverlay {
  id: string;
  type: 'ndvi' | 'stress' | 'pest-risk' | 'irrigation';
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  opacity: number;
  timestamp: string;
  farmId?: string;
}

export interface DrawingTool {
  type: 'rectangle' | 'polygon' | 'marker';
  isActive: boolean;
}

export interface MapControls {
  showLayerControl: boolean;
  showDrawingTools: boolean;
  showLocationSearch: boolean;
  showFullscreenControl: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bounds?: MapBounds;
}