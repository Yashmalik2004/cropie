const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { ee } = require("./utils/geeInit");
const userRoutes = require("./routes/user.route.js");
const farmRoutes = require("./routes/farm.route.js");

const app = express();

// Middleware setup
dotenv.config();

// CORS configuration for production
const corsOptions = {
  credentials: true,
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://agrixplatform.vercel.app'] 
    : ["http://localhost:3000"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.locals.ee = ee;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CropLab Backend is running!', status: 'healthy' });
});

// Routes
app.use("/user", userRoutes);
app.use("/farms", farmRoutes);

module.exports = app;
