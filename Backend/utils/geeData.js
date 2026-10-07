const { ee } = require('./geeInit');

/**
 * Get NDVI data from Google Earth Engine for given coordinates
 * @param {Array} coordinates - Array of coordinate points
 * @param {Object} config - Configuration for GEE data retrieval
 * @returns {Promise<Object>} NDVI data or null if error
 */
async function getNDVIData(coordinates, config = {}) {
  try {
    // Default configuration
    const cfg = {
      scale: config.scale || 10,
      dateRangeMonths: config.dateRangeMonths || 3,
      ...config
    };
    
    const region = ee.Geometry.Polygon([coordinates]);
    
    // Calculate date range
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - cfg.dateRangeMonths);
    
    // Get Sentinel-2 collection
    const collection = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(region)
      .filterDate(start, end)
      .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20))
      .sort('system:time_start', false);
    
    // Calculate NDVI
    const ndvi = collection.map(image => {
      return image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    }).first();
    
    // Clip to region
    const clipped = ndvi.clip(region);
    
    // Get image info
    const info = await new Promise((resolve, reject) => {
      clipped.getInfo((info, err) => {
        if (err) reject(new Error(String(err)));
        else resolve(info);
      });
    });
    
    return {
      success: true,
      data: info,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching NDVI data:', error.message);
    return null;
  }
}

/**
 * Get sensor data from Google Earth Engine for given coordinates
 * @param {Array} coordinates - Array of coordinate points
 * @param {Object} config - Configuration for sensor data retrieval
 * @returns {Promise<Object>} Sensor data or null if error
 */
async function getSensorData(coordinates, config = {}) {
  try {
    // Default configuration
    const cfg = {
      scale: config.scale || 1000,
      assets: config.assets || {
        ECe: 'projects/sih2k25-472714/assets/ECe',
        N: 'projects/sih2k25-472714/assets/N',
        P: 'projects/sih2k25-472714/assets/P',
        OC: 'projects/sih2k25-472714/assets/OC',
        pH: 'projects/sih2k25-472714/assets/pH'
      },
      ...config
    };
    
    const region = ee.Geometry.Polygon([coordinates]);
    
    // Load sensor data
    const sensorData = {};
    for (const [name, asset] of Object.entries(cfg.assets)) {
      try {
        const image = ee.Image(asset).clip(region);
        
        // Get image info
        const info = await new Promise((resolve, reject) => {
          image.getInfo((info, err) => {
            if (err) reject(new Error(String(err)));
            else resolve(info);
          });
        });
        
        sensorData[name] = info;
      } catch (error) {
        console.error(`Error fetching ${name} data:`, error.message);
      }
    }
    
    return {
      success: true,
      data: sensorData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching sensor data:', error.message);
    return null;
  }
}

module.exports = { getNDVIData, getSensorData };