const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/auth.middleware");

const userController = require("../controllers/user.controller");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.get("/protected", isLoggedIn, userController.protected);

// Admin routes
router.get("/all", isLoggedIn, userController.getAllUsers);
router.get("/stats", isLoggedIn, userController.getUserStats);

module.exports = router;
