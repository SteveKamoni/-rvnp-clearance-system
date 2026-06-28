// server/src/controllers/authController.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Generate JWT token
 * @param {Object} user
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { idNumber, password, role } = req.body;

    if (!idNumber || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "idNumber, password and role are required",
      });
    }

    const user = await User.findOne({ idNumber });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been disabled",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        idNumber: user.idNumber,
        role: user.role,
        department: user.department,
        course: user.course,
        admNo: user.admNo,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Return authenticated user
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  login,
  getMe,
};
