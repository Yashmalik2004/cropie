const User = require("../models/user.model.js");
const app = require("../app.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Farm = require("../models/farm.model.js");  
const generateJWT = require("../utils/jwtGenerator.js");
const ResponseEntity = require("../utils/ResponseEntity.js");

// register controller

const register = async (req, res) => {

  const req_body = req.body;

  if (!req_body.fullName) {
    const response = new ResponseEntity(0, "Please Enter the Name", {});
    return res.status(400).json(response);
  }

  if (!req_body.email) {
    const response = new ResponseEntity(0, "Please Enter the E-mail", {});
    return res.status(400).json(response);
  }

  if (!req_body.password) {
    const response = new ResponseEntity(0, "Please Enter the Password", {});
    return res.status(400).json(response);
  }

  if (await User.findOne({ email: req_body.email })) {
    const response = new ResponseEntity(
      0,
      "User is Already Registered with this E-Mail",
      {}
    );
    return res.status(400).json(response);
  }

  const user_req = {
    fullName: req_body.fullName,
    email: req_body.email,
    phone: req_body.phone,
    address: req_body.address,
    hashedPassword: bcrypt.hashSync(req_body.password, 8),
  };

  try {
    const user = await User.create(user_req);
    const token = await generateJWT({ email: user.email });

    // Return user data without password
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    };

    const response = new ResponseEntity(
      1,
      "User Created Successfully",
      {
        token,
        user: userData
      }
    );
    res.cookie("token", token).status(201).json(response);
  } catch (err) {
    console.log("Some Problem Occured While Creating the User:", err);
    const response = new ResponseEntity(0, "Error While Creating the User", {});
    res.status(500).json(response);
  }
};

// Login Controller on the Basis of E-Mail and Password

const login = async (req, res) => {
  console.log("REQUEST FOR LOGIN CAMED")
  const req_body = req.body;
  if (!req_body.email) {
    const response = new ResponseEntity(0, "Enter the E-mail", {});
    return res.status(400).json(response);
  }

  if (!req_body.password) {
    const response = new ResponseEntity(0, "Enter the Password", {});
    return res.status(400).json(response);
  }

  const user = await User.findOne({ email: req_body.email });
  if (!user) {
    const response = new ResponseEntity(
      0,
      "This E-Mail does not Exist in the DataBase",
      {}
    );
    return res.status(400).json(response);
  }

  if (!bcrypt.compareSync(req_body.password, user.hashedPassword)) {
    const response = new ResponseEntity(0, "Invalid Password", {});
    return res.status(400).json(response);
  }

  try {
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    // Return user data without password
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    };
    const Userfarms = await Farm.find({ user: user._id });
    const response = new ResponseEntity(1, "Logged in Successfully", {
      token,
      user: userData,
      farms: Userfarms
    });
    
    res.cookie("token", token).status(200).json(response);
  } catch (error) {
    console.log("Some Error while Logging in:", error)
    const response = new ResponseEntity(0, "Some Error while Logging in", {});
    res.status(500).json(response);
  }
};

// logout controller

const logout = (req, res) => {
  try {
    const response = new ResponseEntity(1, "Logged out Successfully", {});
    res.clearCookie("token").status(200).json(response);
  } catch (error) {
    console.log(req.cookie);
    const response = new ResponseEntity(0, "Error while Logging Out", {});
    res.status(500).json(response);
  }
};

// test route to verify isLoggedIn middleware

const protected = (req, res) => {
  try {
    const response = new ResponseEntity(1, "You are in a Protected Route", {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role
      }
    });
    res.status(200).json(response);
  } catch (error) {
    const response = new ResponseEntity(
      0,
      "Some Error while Accessing the Protected Route",
      {}
    );
    res.status(500).json(response);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      const response = new ResponseEntity(0, "Access denied. Admin only.", {});
      return res.status(403).json(response);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({}, { hashedPassword: 0 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const response = new ResponseEntity(1, "Users fetched successfully", {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    const response = new ResponseEntity(0, "Error fetching users", {});
    res.status(500).json(response);
  }
};

// Get user stats (admin only)
const getUserStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      const response = new ResponseEntity(0, "Access denied. Admin only.", {});
      return res.status(403).json(response);
    }

    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const response = new ResponseEntity(1, "User stats fetched successfully", {
      totalUsers,
      totalFarmers,
      totalAdmins
    });
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    const response = new ResponseEntity(0, "Error fetching user stats", {});
    res.status(500).json(response);
  }
};

module.exports = { register, login, logout, protected, getAllUsers, getUserStats };
