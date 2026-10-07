const ee = require('@google/earthengine');
const fs = require('fs');
const path = require('path');

function initializeEE() {
  return new Promise((resolve, reject) => {
    try {
      let privateKey;
      
      // Try to get from environment variable first (for production)
      if (process.env.GOOGLE_EARTH_ENGINE_KEY) {
        privateKey = JSON.parse(process.env.GOOGLE_EARTH_ENGINE_KEY);
      } else {
        // Fallback to file (for development)
        const privateKeyPath = path.join(__dirname, '..', 'earth-engine-service-account.json');
        if (!fs.existsSync(privateKeyPath)) {
          throw new Error(`Service account key not found at: ${privateKeyPath}`);
        }
        privateKey = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
      }
      
      console.log('🔑 Authenticating with Google Earth Engine...');
      ee.data.authenticateViaPrivateKey(privateKey, (error) => {
        if (error) {
          reject(new Error(`Authentication failed: ${error}`));
          return;
        }
        ee.initialize(null, null, (initError) => {
          if (initError) {
            reject(new Error(`Initialization failed: ${initError}`));
            return;
          }
          console.log('🌍 Google Earth Engine initialized successfully!');
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { initializeEE, ee };
