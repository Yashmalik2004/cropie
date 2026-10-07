const Farm = require("../models/farm.model.js");
const ResponseEntity = require("../utils/ResponseEntity.js");
// const { prepareData } = require("../utils/prepareData");
const { centroidFromRing } = require("../utils/geometry");
const { getDistrictFromCoordinates } = require("../utils/reverseGeocode");
const { getDistrictYield } = require("../utils/districtYield");
const { getNDVIData, getSensorData } = require("../utils/geeData");
const { predictYield } = require("../utils/yieldPrediction");


// Get all farms in the system (admin only)
const getAllFarms = async (req, res) => {
  console.log("GETFARMALL")
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get all farms with pagination
    const farms = await Farm.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "fullName email");

    // Get total count for pagination
    const total = await Farm.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    const response = new ResponseEntity(1, "All farms retrieved successfully", {
      farms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching all farms:", error);
    const response = new ResponseEntity(0, "Error fetching all farms", {});
    res.status(500).json(response);
  }
};
// Get all farms for authenticated user
const getFarms = async (req, res) => {
  console.log("GETFARMs")
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Get farms with pagination
    const farms = await Farm.findByUserId(userId, { page, limit });
    const total = await Farm.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);
    
    
    const response = new ResponseEntity(1, "Farms retrieved successfully", {
      farms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching farms:", error);
    const response = new ResponseEntity(0, "Error fetching farms", {});
    res.status(500).json(response);
  }
};

// Get single farm by ID
const getFarm = async (req, res) => {
  try {
    console.log("GETFARM")
    const farmId = req.params.id;
    const userId = req.user._id;

    const farm = await Farm.findById(farmId);

    if (!farm) {
      const response = new ResponseEntity(0, "Farm not found", {});
      return res.status(404).json(response);
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId)) {
      const response = new ResponseEntity(0, "Access denied", {});
      return res.status(403).json(response);
    }

    

    const response = new ResponseEntity(1, "Farm retrieved successfully", farm);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching farm:", error);
    const response = new ResponseEntity(0, "Error fetching farm", {});
    res.status(500).json(response);
  }
};

// Create new farm
const createFarm = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.body) {
      const response = new ResponseEntity(0, "No request body provided", {});
      return res.status(400).json(response);
    }

    const {
      name,
      crop,
      plantingDate,
      harvestDate,
      description,
      coordinates,
      area,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !crop ||
      !plantingDate ||
      !harvestDate ||
      !coordinates ||
      !area
    ) {
      const response = new ResponseEntity(0, "Missing required fields", {});
      return res.status(400).json(response);
    }

    // Validate coordinates
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      const response = new ResponseEntity(
        0,
        "Invalid coordinates. Must be an array with at least 3 points",
        {}
      );
      return res.status(400).json(response);
    }

    let closedCoordinates = [...coordinates];
    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    // Check if first and last points are the same
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      // If not, add the first point at the end to close the loop
      closedCoordinates.push([...firstPoint]);
    }

    // Validate dates
    const plantDate = new Date(plantingDate);
    const harvestDate_ = new Date(harvestDate);

    if (plantDate >= harvestDate_) {
      const response = new ResponseEntity(
        0,
        "Harvest date must be after planting date",
        {}
      );
      return res.status(400).json(response);
    }

    const geoJsonCoordinates = {
      type: "Polygon",
      coordinates: [closedCoordinates], // Wrap closed coordinates in an array for GeoJSON Polygon format
    };

    // const centroid = centroidFromRing(closedCoordinates);
    // console.log("CENTROID: ", centroid);
    
    // // Get district name from coordinates
    // const [lon, lat] = centroid;
    // const districtName = await getDistrictFromCoordinates(lat, lon);
    // console.log("DISTRICT NAME: ", districtName);
    
    // // Get historical yield for the district
    // const historicalYield = await getDistrictYield(districtName);
    // console.log("HISTORICAL YIELD: ", historicalYield);
    
    // // Get NDVI and sensor data from Google Earth Engine
    // const ndviData = await getNDVIData(closedCoordinates);
    // const sensorData = await getSensorData(closedCoordinates);
    // console.log("GEE DATA RETRIEVED");
    
    // // Predict yield using ML model (dummy implementation for now)
    // const predictedYield = await predictYield(
    //   ndviData ? [0.5, 0.6, 0.7] : null, // Dummy data for now
    //   sensorData ? [0.4, 0.5, 0.6] : null // Dummy data for now
    // );
    // console.log("PREDICTED YIELD: ", predictedYield);

    const farmData = {
      name: name.trim(),
      crop: crop.trim(),
      plantingDate: plantDate,
      harvestDate: harvestDate_,
      description: description?.trim(),
      area: parseFloat(area),
      userId,
      coordinates: geoJsonCoordinates, // Use the GeoJSON format
    };
    const farm = await Farm.create(farmData);

    const response = new ResponseEntity(1, "Farm created successfully", {
      farm,
      // geospatialAnalysis: {
      //   centroid,
      //   districtName,
      //   historicalYield,
      //   predictedYield,
      //   ndviDataAvailable: !!ndviData,
      //   sensorDataAvailable: !!sensorData
      // }
    });
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating farm:", error);

    if (error.name === "ValidationError") {
      const response = new ResponseEntity(0, error.message, {});
      return res.status(400).json(response);
    }

    const response = new ResponseEntity(0, "Error creating farm", {});
    res.status(500).json(response);
  }
};

// Update farm
const updateFarm = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json(new ResponseEntity(0, "Farm not found", {}));
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId) && req.user.role !== "admin") {
      return res.status(403).json(new ResponseEntity(0, "Access denied", {}));
    }

    // Validate dates
    if (updateData.plantingDate && updateData.harvestDate) {
      const plantDate = new Date(updateData.plantingDate);
      const harvestDate = new Date(updateData.harvestDate);

      if (plantDate >= harvestDate) {
        return res.status(400).json(
          new ResponseEntity(0, "Harvest date must be after planting date", {})
        );
      }
    }

    // Handle coordinates
    let centroid = null;
    if (updateData.coordinates) {
      const coords = updateData.coordinates.coordinates;

      if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 3) {
        return res.status(400).json(
          new ResponseEntity(0, "Invalid coordinates. Must be an array with at least 3 points", {})
        );
      }

      let closedCoordinates = [...coords[0]];
      const firstPoint = closedCoordinates[0];
      const lastPoint = closedCoordinates[closedCoordinates.length - 1];

      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        closedCoordinates.push([...firstPoint]);
      }

      updateData.coordinates = {
        type: "Polygon",
        coordinates: [closedCoordinates],
      };
      
      // Calculate centroid for geospatial analysis
      centroid = centroidFromRing(closedCoordinates);
    }

    // Perform geospatial analysis if coordinates were updated
    let geospatialAnalysis = null;
    if (centroid) {
      // Get district name from coordinates
      const [lon, lat] = centroid;
      const districtName = await getDistrictFromCoordinates(lat, lon);
      
      // Get historical yield for the district
      const historicalYield = await getDistrictYield(districtName);
      
      // Get NDVI and sensor data from Google Earth Engine
      const ndviData = await getNDVIData(updateData.coordinates.coordinates[0]);
      const sensorData = await getSensorData(updateData.coordinates.coordinates[0]);
      
      // Predict yield using ML model (dummy implementation for now)
      const predictedYield = await predictYield(
        ndviData ? [0.5, 0.6, 0.7] : null, // Dummy data for now
        sensorData ? [0.4, 0.5, 0.6] : null // Dummy data for now
      );
      
      geospatialAnalysis = {
        centroid,
        districtName,
        historicalYield,
        predictedYield,
        ndviDataAvailable: !!ndviData,
        sensorDataAvailable: !!sensorData
      };
    }

    // Update farm. Also drop the cached heatmap so the next view of this
    // farm refetches fresh imagery/AI output instead of showing analysis
    // tied to the previous boundary, dates, or crop.
    const updatedFarm = await Farm.findByIdAndUpdate(
      farmId,
      { ...updateData, $unset: { heatmapCache: "" } },
      {
        new: true,
        runValidators: true,
      }
    );

    const responseData = {
      farm: updatedFarm
    };
    
    // Include geospatial analysis if it was performed
    if (geospatialAnalysis) {
      responseData.geospatialAnalysis = geospatialAnalysis;
    }

    return res
      .status(200)
      .json(new ResponseEntity(1, "Farm updated successfully", responseData));
  } catch (error) {
    console.error("Error updating farm:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json(new ResponseEntity(0, error.message, {}));
    }

    return res
      .status(500)
      .json(new ResponseEntity(0, "Error updating farm", { error: error.message }));
  }
};

// Delete farm
const deleteFarm = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;

    const farm = await Farm.findById(farmId);

    if (!farm) {
      const response = new ResponseEntity(0, "Farm not found", {});
      return res.status(404).json(response);
    }

    // Check if user owns this farm
    if (!farm.isOwnedBy(userId)) {
      const response = new ResponseEntity(0, "Access denied", {});
      return res.status(403).json(response);
    }

    await Farm.findByIdAndDelete(farmId);

    const response = new ResponseEntity(1, "Farm deleted successfully", {});
    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting farm:", error);
    const response = new ResponseEntity(0, "Error deleting farm", {});
    res.status(500).json(response);
  }
};

// GET /farms/:id/heatmap - Retrieve cached heatmap data from MongoDB
const getHeatmap = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json(new ResponseEntity(0, "Farm not found", {}));
    }
    if (!farm.isOwnedBy(userId) && req.user.role !== "admin") {
      return res.status(403).json(new ResponseEntity(0, "Access denied", {}));
    }
    if (!farm.heatmapCache || !farm.heatmapCache.data) {
      return res.status(404).json(new ResponseEntity(0, "No heatmap cache found", {}));
    }
    console.log("Response bhej rha hu: ", farm.heatmapCache.data);
    return res.status(200).json(
      new ResponseEntity(1, "Heatmap cache retrieved", {
        data: farm.heatmapCache.data,
        cachedAt: farm.heatmapCache.cachedAt,
      })
    );
  } catch (error) {
    console.error("Error fetching heatmap cache:", error);
    return res.status(500).json(new ResponseEntity(0, "Error fetching heatmap cache", {}));
  }
};

// POST /farms/:id/heatmap - Save heatmap data to MongoDB
const saveHeatmap = async (req, res) => {
  try {
    const farmId = req.params.id;
    const userId = req.user._id;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json(new ResponseEntity(0, "No heatmap data provided", {}));
    }

    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json(new ResponseEntity(0, "Farm not found", {}));
    }
    if (!farm.isOwnedBy(userId) && req.user.role !== "admin") {
      return res.status(403).json(new ResponseEntity(0, "Access denied", {}));
    }

    const cachedAt = new Date();
    farm.heatmapCache = { data, cachedAt };
    await farm.save();
    console.log("save kr rha hu, heatmap ko");
    return res.status(200).json(
      new ResponseEntity(1, "Heatmap data saved successfully", {
        cachedAt: cachedAt.toISOString(),
      })
    );
  } catch (error) {
    console.error("Error saving heatmap cache:", error);
    return res.status(500).json(new ResponseEntity(0, "Error saving heatmap cache", {}));
  }
};

module.exports = {
  getFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getAllFarms,
  getHeatmap,
  saveHeatmap,
};
