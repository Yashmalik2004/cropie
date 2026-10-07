const axios = require('axios');

/**
 * Get district name from coordinates using OpenStreetMap Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} District name or null if not found
 */
async function getDistrictFromCoordinates(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'AgriProject/1.0' // Required by Nominatim API
      },
      timeout: 5000
    });
    console.log("Response:", response.data);
    // Extract district from address details
    const address = response.data.address;
    return address.state_district || 'agra';
  } catch (error) {
    console.error('Error fetching district from coordinates:', error.message);
    return null;
  }
}

module.exports = { getDistrictFromCoordinates };