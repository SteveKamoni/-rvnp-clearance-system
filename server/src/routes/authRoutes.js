// server/src/routes/authRoutes.js

const express = require("express");
const jwt = require("jsonwebtoken");

const { login, getMe } = require("../controllers/authController");

const router = express.Router();

/**
 * Inline JWT Authentication Middleware
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get("/me", authenticate, getMe);

module.exports = router;
