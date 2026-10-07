CropLab — AI-Powered Crop Health Analysis System
Overview
CropLab is a satellite-based crop health monitoring and analysis platform designed for agricultural field officers to remotely monitor, analyze, and act on crop health data across large agricultural regions. The system combines multi-spectral satellite imagery from the European Space Agency's Sentinel-2 mission with historical baseline analysis, real-time weather data, regional market rates, and LLM-generated agronomic insights — delivering a comprehensive farm intelligence dashboard without requiring physical field visits.

Problem Statement
Agricultural field officers in India are responsible for monitoring crop health across dozens of farms and hundreds of hectares within their jurisdiction. Currently this is done through physical site visits and district-level reports, which are infrequent, labor-intensive, and unable to capture real-time stress events like drought, waterlogging, or nutrient deficiency. Existing satellite tools are either too technical for non-specialist users or too expensive for government agricultural departments. CropLab addresses this gap by providing an accessible, visual, data-grounded monitoring interface built entirely on free and open data sources.

System Architecture
CropLab is built as a full-stack web application with a clear separation between frontend and backend responsibilities.
The frontend is built with Next.js 15 and TypeScript, using Leaflet.js for interactive map rendering. Users interact with a satellite base map to define farm boundaries as geographic polygons, configure farm metadata, and visualize analysis results through layered map overlays with individual opacity controls.
The backend is a FastAPI application written in Python, responsible for all satellite data fetching, processing, anomaly computation, and external API orchestration. FastAPI was chosen specifically because the entire geospatial processing ecosystem — including the Google Earth Engine Python SDK, NumPy, and rasterio — exists only in Python. The backend exposes a single core analysis function, analyze_crop_health(), designed as a modular, independently callable unit that can be integrated into any endpoint, background job, or scheduled task without modification.
Data is persisted in MongoDB for farm records and user data. Redis is used for caching satellite raster results to avoid redundant Google Earth Engine API calls, which carry significant latency.

Farm Creation and Configuration
Users create a farm by drawing a polygon boundary directly on an interactive satellite map. The polygon coordinates are stored as a GeoJSON geometry. Each farm record stores the farm name, crop variety, cultivation start date, harvest date, and the polygon geometry. This geometry becomes the spatial boundary for all subsequent satellite analysis.
A farm dashboard displays all registered farms as cards showing crop type, area in hectares, planting and harvest dates, and a computed health status badge. Clicking a farm navigates to its dedicated analysis page.

Satellite Data Pipeline
All satellite data is sourced from the Copernicus Sentinel-2 Surface Reflectance collection (COPERNICUS/S2_SR_HARMONIZED) via the Google Earth Engine Python API. Sentinel-2 provides multispectral imagery at 10-metre spatial resolution with a revisit period of approximately five days, making it suitable for crop monitoring at field scale.
Three spectral indices are computed per farm:
NDVI (Normalized Difference Vegetation Index) is calculated as (B8 - B4) / (B8 + B4) using the near-infrared and red bands. NDVI measures photosynthetic activity and overall vegetation density. Values between 0.6 and 0.9 indicate healthy, dense crop cover. Values between 0.2 and 0.4 indicate sparse or stressed vegetation. Values below 0.1 and above 0.9 are masked as transparent — filtering out roads, water bodies, built-up areas, and non-agricultural vegetation that would otherwise produce false signals.
NDWI (Normalized Difference Water Index) is calculated using the green and near-infrared bands to measure canopy water content and surface moisture. It is rendered as the Hydration Map with four classified tiers from very low water to high water. Pixels below -0.3 are masked to exclude dry bare soil and built-up areas from the visualization.
NDRE (Normalized Difference Red Edge Index) uses the red-edge band to assess chlorophyll concentration and nitrogen availability in the crop canopy. It is rendered as the Nutrient Map with four tiers from stressed vegetation to very healthy, making it particularly useful for detecting early-stage nutrient deficiency before it becomes visible to the naked eye.
Each index is rendered as a classified tile layer using GEE's getMapId() method, which returns a tile URL compatible with standard web mapping libraries. The frontend adds these as toggleable overlay layers on the satellite base map, with individual opacity sliders for each classification tier. Users can switch between the Health Map, Hydration Map, Nutrient Map, and Trend Map from the overlay controls panel.

NDVI Anomaly Detection
The fourth and analytically most significant layer is the Trend Map, which implements historical NDVI anomaly detection using the following logic:
A reference date is first computed from the farm's cultivation and harvest dates. If the farm is actively in its growing season (cultivation date is past and harvest date is future), the current date is used. If the crop has already been harvested, the harvest date is used as the reference. This ensures the analysis always reflects a meaningful point in the crop's lifecycle.
Three Sentinel-2 images are then fetched from GEE for this reference date across three consecutive years — the current year and the two preceding years — using a ±7 day cloud-free search window. Images are filtered by cloud coverage below 20%, sorted by cloud cover, and mosaicked to handle cases where the farm boundary spans multiple satellite tiles. A ±15 day fallback window is applied if no suitable image is found within the initial window. If fewer than two years of cloud-free imagery are available, the endpoint returns an informative error rather than producing a meaningless result.
The historical mean NDVI is computed as the pixel-wise average of the two historical rasters. The anomaly is then computed as the difference between the current NDVI and this historical mean, giving a per-pixel value indicating how much the current vegetation health deviates from what is historically normal for that exact location at that time of year. Positive anomaly values indicate healthier-than-normal conditions; negative values indicate stress or decline.
The anomaly map is rendered with a diverging blue-red palette: blue pixels are performing better than historical baseline, red pixels are performing worse. Overlaid on the satellite base map, the result gives a field officer an immediately interpretable spatial view of where crop stress is emerging across the region.
NDVI rasters are cached in Redis with a 30-minute TTL using a cache key composed of the farm centroid coordinates and the target date. This avoids repeat GEE calls for the same farm within a session, significantly reducing response times on subsequent analyses.

NDVI Trend Analysis
The three NDVI rasters fetched for anomaly detection are additionally used to compute a regional mean NDVI value per year. This produces a three-point time series showing whether vegetation health in the farm region has been improving, stable, or declining over the past two years relative to the current season. This trend data is surfaced as a line chart in the farm analysis panel, providing temporal context that a single-snapshot analysis cannot convey.

Stress Type Disambiguation
By cross-referencing the three spectral indices, CropLab classifies observed stress into more specific categories:

Low NDVI + Low NDWI + Normal NDRE → Water stress
Low NDVI + Normal NDWI + Low NDRE → Nutrient stress
Low NDVI + Low NDWI + Low NDRE → Severe combined stress

This cross-index fusion moves beyond a binary healthy/stressed classification to provide a directional signal on the likely cause of observed crop decline, enabling more targeted field intervention.

Summary Statistics and Health Status
Each analysis produces a summary of the classified farm area: the percentage of vegetation classified as healthy, stressed, and unclassified, along with total vegetation coverage as a fraction of the farm boundary. From these, a composite health score is derived as the ratio of stressed area to total vegetated area. This score is mapped to a human-readable label — Healthy, Mild Stress, Moderate Stress, or Severe Stress — displayed as a colored badge on the farm dashboard card, giving field officers an at-a-glance triage indicator across all monitored farms without needing to open individual analysis pages.

Soil Data Integration
Regional soil properties are sourced from the ISRIC SoilGrids / Homosoil dataset covering the period 1969–2022. Four properties are available at 1km spatial resolution: soil pH, organic carbon content, electrical conductivity, and nitrogen and phosphorus levels. Given the coarse resolution of this data, it is not visualized as a map layer. Instead, it is used as structured context injected into the AI recommendations prompt, grounding the generated advice in the actual soil chemistry of the region rather than generic agronomic rules.

Weather Data
Historical and forecast weather data is fetched from the Open-Meteo API for the farm's geographic coordinates, covering the full growing season from cultivation date to harvest date. The weather panel displays temperature, precipitation, and conditions across this period. Waterlogging risk is flagged when cumulative recent rainfall exceeds regional thresholds in combination with elevated NDWI readings, providing an early warning for field drainage issues.

Market and News Context
Current mandi (wholesale market) prices for the registered crop variety are fetched from the data.gov.in Agmarknet API, showing the prevailing price per quintal at the nearest relevant market. Regional crop news is fetched from NewsAPI, filtered by crop variety and farm location, surfacing recent developments that may be contextually relevant to the farm officer's monitoring activity.

AI-Generated Recommendations
A structured prompt is assembled from the complete farm analysis output — health status, NDVI trend, anomaly value, stress type classification, soil properties, crop variety, days to harvest, and weather summary — and submitted to an LLM via the Anthropic API. The model returns two to three specific, actionable recommendations grounded in the actual data rather than generic advice. Because the input is real satellite and soil data rather than user-entered text, the recommendations are contextualized to the specific farm's observed condition at the time of analysis.

Tech Stack
Frontend: Next.js 15, TypeScript, Tailwind CSS, Leaflet.js
Backend: FastAPI (Python), Google Earth Engine Python SDK, NumPy
Database: MongoDB
Cache: Redis
Data Sources: Sentinel-2 via Google Earth Engine, ISRIC SoilGrids, Open-Meteo, data.gov.in Agmarknet, NewsAPI
AI: Anthropic Claude API

Known Limitations
The system is optimized for agricultural land. Farm boundaries drawn over water bodies, urban areas, or river floodplains will produce false classifications in the NDVI and NDRE layers, as spectral indices for non-crop surfaces overlap with stressed vegetation ranges. Riparian vegetation along canals and rivers consistently reads high NDVI and appears as healthy crop on the Health Map — this is a known limitation of NDVI-based analysis and is documented in the interface. Soil data is regional at 1km resolution and reflects historical averages rather than current field conditions. Anomaly detection requires at least two years of cloud-free imagery for the target date window; regions with persistent cloud cover may return insufficient data errors.