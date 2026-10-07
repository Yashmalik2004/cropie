const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    plantingDate: {
      type: Date,
      required: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
coordinates: {
  type: {
    type: String,
    enum: ["Polygon"],
    required: true
  },
  coordinates: {
    type: [[[Number]]], // Array of array of array of numbers (GeoJSON Polygon)
    required: true,
    validate: {
      validator: function(coords) {
        return coords[0].length >= 3; // at least 3 points
      },
      message: "Farm must have at least 3 coordinate points"
    }
  }
}
,

    area: {
      type: Number,
      required: true,
      min: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    heatmapCache: {
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      cachedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Add indexes for better query performance
farmSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user queries
farmSchema.index({ coordinates: '2dsphere' }); // Geospatial index for location queries

// Virtual for area calculation validation (optional utility)
farmSchema.virtual('calculatedArea').get(function() {
  if (!this.coordinates || this.coordinates.length < 3) return 0;
  
  // Simple polygon area calculation using shoelace formula
  let area = 0;
  const n = this.coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += this.coordinates[i][0] * this.coordinates[j][1];
    area -= this.coordinates[j][0] * this.coordinates[i][1];
  }
  
  return Math.abs(area) / 2;
});

// Method to check if user owns this farm
farmSchema.methods.isOwnedBy = function(userId) {
  return this.userId.toString() === userId.toString();
};

// Static method to find farms by user
farmSchema.statics.findByUserId = function(userId, options = {}) {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email');
};

module.exports = mongoose.model("Farm", farmSchema);