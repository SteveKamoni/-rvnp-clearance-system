// server/src/routes/clearanceRoutes.js

const express = require("express");

const { authenticate, authorize } = require("../middleware/auth");

const {
  getMyClearance,
  requestClearance,
  officerAction,
  studentResponse,
  getOfficerQueue,
  getClearanceById,
  getAllClearances,
  getOfficerHistory,
} = require("../controllers/clearanceController");

const router = express.Router();

/**
 * ==================================================
 * Student Routes
 * ==================================================
 */

// GET /api/clearance/my
router.get("/my", authenticate, authorize("student"), getMyClearance);

// PATCH /api/clearance/request/:sno
router.patch(
  "/request/:sno",
  authenticate,
  authorize("student"),
  requestClearance,
);

// PATCH /api/clearance/respond/:sno
router.patch(
  "/respond/:sno",
  authenticate,
  authorize("student"),
  studentResponse,
);

/**
 * ==================================================
 * Officer Routes
 * ==================================================
 */

// GET /api/clearance/queue
router.get("/queue", authenticate, authorize("officer"), getOfficerQueue);

// PATCH /api/clearance/:studentId/department/:sno
router.patch(
  "/:studentId/department/:sno",
  authenticate,
  authorize("officer"),
  officerAction,
);

/**
 * ==================================================
 * Admin Routes
 * ==================================================
 */

// GET /api/clearance/all
router.get("/all", authenticate, authorize("admin"), getAllClearances);

/**
 * ==================================================
 * Officer + Admin Routes
 * IMPORTANT:
 * Keep this parameter route LAST so it doesn't
 * conflict with /my, /queue, or /all.
 * ==================================================
 */

// GET /api/clearance/history
router.get(
  "/history",
  authenticate,
  authorize("officer"),
  getOfficerHistory
);

// GET /api/clearance/:studentId
router.get(
  "/:studentId",
  authenticate,
  authorize("officer", "admin"),
  getClearanceById,
);

module.exports = router;
