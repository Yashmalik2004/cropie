const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

dotenv.config();

const PORT = process.env.PORT || 8000;

// MongoDB connection with improved timeout settings
async function startServer() {
  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    console.log("✓ Connected to MongoDB successfully");

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    console.error("\nPossible solutions:");
    console.error("1. Check your internet connection");
    console.error(
      "2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 to allow all IPs)",
    );
    console.error("3. Ensure your MongoDB cluster is active (not paused)");
    console.error("4. Check if Windows Firewall is blocking the connection");
    console.error("5. Verify MONGODB_URI in .env file is correct");
    process.exit(1);
  }
}

startServer();
