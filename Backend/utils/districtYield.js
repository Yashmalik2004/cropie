const fs = require('fs');
const path = require('path');

/**
 * Get yield value for a district from CSV data
 * @param {string} districtName - Name of the district
 * @param {string} csvPath - Path to the CSV file with district,yield data
 * @param {number} defaultValue - Default yield value if district not found
 * @returns {Promise<number>} Yield value for the district or default value
 */
async function getDistrictYield(districtName, csvPath = null, defaultValue = 4.0) {
  // Use default path if none provided
  if (!csvPath) {
    csvPath = path.join(__dirname, '..', 'district_yield.csv');
  }
  
  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.log(`CSV file not found at ${csvPath}, using default yield value`);
    return defaultValue;
  }
  
  try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n');
    
    // Skip header if exists
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (format: id,district_name,yield)
      const parts = line.split(',');
      if (parts.length >= 3) {
        const [, csvDistrictName, yieldValue] = parts;
        if (csvDistrictName && csvDistrictName.trim().toLowerCase() === districtName.toLowerCase()) {
          const yieldNum = parseFloat(yieldValue);
          return isNaN(yieldNum) ? defaultValue : yieldNum;
        }
      }
    }
    
    // District not found in CSV
    console.log(`District "${districtName}" not found in CSV, using default yield value`);
    return defaultValue;
  } catch (error) {
    console.error('Error reading district yield data:', error.message);
    return defaultValue;
  }
}

module.exports = { getDistrictYield };