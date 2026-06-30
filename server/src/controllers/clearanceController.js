// server/src/controllers/clearanceController.js

const Clearance = require("../models/Clearance");
const User = require("../models/User");

/**
 * ==================================================
 * Shared Populate Configuration
 * ==================================================
 */

const studentPopulate = {
  path: "student",
  select:
    "fullName admNo course department nationalId phone1 phone2 parentGuardianName permanentAddress dateOfCompletion",
};

const officerPopulate = {
  path: "departments.officerId",
  select: "fullName department",
};

const historyPopulate = {
  path: "departments.actionHistory.actor",
  select: "fullName role",
};

/**
 * ==================================================
 * Helpers
 * ==================================================
 */

const populateClearance = (query) =>
  query
    .populate(studentPopulate)
    .populate(officerPopulate)
    .populate(historyPopulate);

const findDepartment = (clearance, sno) =>
  clearance.departments.find((department) => department.sno === Number(sno));

/**
 * ==================================================
 * GET /api/clearance/my
 * Student Only
 * ==================================================
 */

const getMyClearance = async (req, res) => {
  try {
    const clearance = await populateClearance(
      Clearance.findOne({
        student: req.user.id,
      }),
    );

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      clearance,
    });
  } catch (error) {
    console.error("getMyClearance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * PATCH /api/clearance/request/:sno
 * Student Only
 * ==================================================
 */

const requestClearance = async (req, res) => {
  try {
    const { sno } = req.params;

    const clearance = await Clearance.findOne({
      student: req.user.id,
    });

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    const departmentIndex = clearance.departments.findIndex(
      (department) => department.sno === Number(sno),
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const department = clearance.departments[departmentIndex];

    if (department.status !== "pending" && department.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "This department cannot be requested at its current status.",
      });
    }

    department.status = "requested";
    department.requestedAt = new Date();

    clearance.addDepartmentHistory(departmentIndex, {
      action: "requested",
      actor: req.user.id,
      actorRole: "student",
      reason: "",
    });

    await clearance.save();

    const updatedClearance = await populateClearance(
      Clearance.findById(clearance._id),
    );

    return res.status(200).json({
      success: true,
      message: "Clearance request submitted successfully.",
      clearance: updatedClearance,
    });
  } catch (error) {
    console.error("requestClearance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
/**
 * ==================================================
 * PATCH /api/clearance/:studentId/department/:sno
 * Officer Only
 * ==================================================
 */

const officerAction = async (req, res) => {
  try {
    const { studentId, sno } = req.params;
    const { action, reason, deductionAmount } = req.body;

    const allowedActions = ["cleared", "rejected", "summoned"];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Allowed actions are: cleared, rejected, summoned.",
      });
    }

    if (
      (action === "rejected" || action === "summoned") &&
      (!reason || !reason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason is required.",
      });
    }

    const clearance = await Clearance.findOne({
      student: studentId,
    });

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    const departmentIndex = clearance.departments.findIndex(
      (department) => department.sno === Number(sno),
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const department = clearance.departments[departmentIndex];

    // Officer can only manage their assigned department
    if (department.name !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this department.",
      });
    }

    department.status = action;
    department.updatedAt = new Date();

    if (action === "cleared") {
      department.clearedAt = new Date();
      department.deductionAmount = Number(deductionAmount) || 0;
      department.officerReason = "";
    }

    if (action === "rejected" || action === "summoned") {
      department.officerReason = reason.trim();
      department.clearedAt = null;
    }

    clearance.addDepartmentHistory(departmentIndex, {
      action,
      actor: req.user.id,
      actorRole: "officer",
      reason: reason || "",
    });

    await clearance.save();

    const updatedClearance = await populateClearance(
      Clearance.findById(clearance._id),
    );

    return res.status(200).json({
      success: true,
      message: `Department ${action} successfully.`,
      clearance: updatedClearance,
    });
  } catch (error) {
    console.error("officerAction:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * PATCH /api/clearance/respond/:sno
 * Student Only
 * ==================================================
 */

const studentResponse = async (req, res) => {
  try {
    const { sno } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response is required.",
      });
    }

    const clearance = await Clearance.findOne({
      student: req.user.id,
    });

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    const departmentIndex = clearance.departments.findIndex(
      (department) => department.sno === Number(sno),
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const department = clearance.departments[departmentIndex];

    if (department.status !== "rejected" && department.status !== "summoned") {
      return res.status(400).json({
        success: false,
        message: "You can only respond to a rejected or summoned request.",
      });
    }

    if (
      department.studentResponse &&
      department.studentResponse.trim() !== ""
    ) {
      return res.status(400).json({
        success: false,
        message: "You have already responded to this department.",
      });
    }

    department.studentResponse = response.trim();
    department.studentRespondedAt = new Date();

    clearance.addDepartmentHistory(departmentIndex, {
      action: "student_response",
      actor: req.user.id,
      actorRole: "student",
      reason: response.trim(),
    });

    await clearance.save();

    const updatedClearance = await populateClearance(
      Clearance.findById(clearance._id),
    );

    return res.status(200).json({
      success: true,
      message: "Response submitted successfully.",
      clearance: updatedClearance,
    });
  } catch (error) {
    console.error("studentResponse:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
/**
 * ==================================================
 * GET /api/clearance/queue
 * Officer Only
 * ==================================================
 */

const getOfficerQueue = async (req, res) => {
  try {
    const officerDepartment = req.user.department;

    const clearances = await populateClearance(
      Clearance.find({
        departments: {
          $elemMatch: {
            name: officerDepartment,
            status: "requested",
          },
        },
      }),
    );

    const queue = clearances.map((clearance) => {
      const department = clearance.departments.find(
        (dept) =>
          dept.name === officerDepartment && dept.status === "requested",
      );

      return {
        ...clearance.toObject(),
        departments: department ? [department] : [],
      };
    });

    return res.status(200).json({
      success: true,
      count: queue.length,
      clearances: queue,
    });
  } catch (error) {
    console.error("getOfficerQueue:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * GET /api/clearance/:studentId
 * Officer / Admin
 * ==================================================
 */

const getClearanceById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const clearance = await populateClearance(
      Clearance.findOne({
        student: studentId,
      }),
    );

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      clearance,
    });
  } catch (error) {
    console.error("getClearanceById:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * GET /api/clearance/all
 * Admin Only
 * ==================================================
 */

const getAllClearances = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const status = req.query.status;
    const search = req.query.search?.trim().toLowerCase();

    const filter = {};

    if (status) {
      filter.overallStatus = status;
    }

    let clearances = await populateClearance(Clearance.find(filter));

    if (search) {
      clearances = clearances.filter((record) => {
        const student = record.student;

        return (
          student?.fullName?.toLowerCase().includes(search) ||
          student?.admNo?.toLowerCase().includes(search)
        );
      });
    }

    const total = clearances.length;
    const pages = Math.ceil(total / limit);

    const paginated = clearances.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      clearances: paginated,
      total,
      page,
      pages,
    });
  } catch (error) {
    console.error("getAllClearances:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getOfficerHistory = async (req, res) => {
  try {
    const officerDepartment = req.user.department;

    const clearances = await Clearance.find({
      departments: {
        $elemMatch: {
          name: officerDepartment,
          status: { $in: ["cleared", "rejected", "summoned"] },
        },
      },
    }).populate({
      path: "student",
      select: "fullName admNo course department phone1",
    });

    const history = clearances.map((clearance) => {
      const department = clearance.departments.find(
        (dept) =>
          dept.name === officerDepartment &&
          ["cleared", "rejected", "summoned"].includes(dept.status),
      );

      return {
        ...clearance.toObject(),
        departments: department ? [department] : [],
      };
    });

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("getOfficerHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * Admin Functions
 * ==================================================
 */

const adminOverride = async (req, res) => {
  try {
    const { studentId, sno } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required.",
      });
    }

    const clearance = await Clearance.findOne({ student: studentId });

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: "Clearance record not found.",
      });
    }

    const departmentIndex = clearance.departments.findIndex(
      (dept) => dept.sno === Number(sno)
    );

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const department = clearance.departments[departmentIndex];

    if (department.status !== "rejected" && department.status !== "summoned") {
      return res.status(400).json({
        success: false,
        message: "Override only allowed on rejected or summoned departments",
      });
    }

    department.status = "cleared";
    department.clearedAt = new Date();
    department.officerReason = "Admin override: " + reason.trim();

    clearance.addDepartmentHistory(departmentIndex, {
      action: "cleared",
      actor: req.user.id,
      actorRole: "admin",
      reason: "Admin override: " + reason.trim(),
    });

    await clearance.save();

    const updatedClearance = await populateClearance(
      Clearance.findById(clearance._id)
    );

    return res.status(200).json({
      success: true,
      message: "Department cleared by admin",
      clearance: updatedClearance,
    });
  } catch (error) {
    console.error("adminOverride error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const clearances = await Clearance.find({});

    const fullyCleared = clearances.filter(
      (c) => c.overallStatus === "cleared"
    ).length;
    const inProgress = clearances.filter(
      (c) => c.overallStatus === "in_progress"
    ).length;
    const pending = clearances.filter(
      (c) => c.overallStatus === "pending"
    ).length;
    const summoned = clearances.filter(
      (c) => c.overallStatus === "summoned"
    ).length;
    const blocked = clearances.filter(
      (c) => c.overallStatus === "blocked"
    ).length;

    const totalDeductions = clearances.reduce(
      (sum, c) => sum + (c.totalDeductions || 0),
      0
    );

    const DEPARTMENTS = [
      "Head of Music",
      "Head of Drama",
      "Head of Industrial Liaison (ILO)",
      "Head of Guidance & Counselling",
      "Head of Sports (Games items)",
      "Head of Library",
      "Housekeeper (Beddings)",
      "Stores Controller",
      "Storekeeper (Department)",
      "Head of Department (HOD)",
      "Exams Officer (Department)",
      "Dean of Students (College ID)",
      "Fees Balance (KShs)",
      "Registrar (Administration)",
    ];

    const departmentStats = DEPARTMENTS.map((name, index) => {
      const sno = index + 1;
      let cleared = 0;
      let pendingCount = 0;
      let requested = 0;
      let rejected = 0;
      let summonedCount = 0;

      clearances.forEach((c) => {
        const dept = c.departments.find((d) => d.sno === sno);
        if (dept) {
          switch (dept.status) {
            case "cleared":
              cleared++;
              break;
            case "pending":
              pendingCount++;
              break;
            case "requested":
              requested++;
              break;
            case "rejected":
              rejected++;
              break;
            case "summoned":
              summonedCount++;
              break;
          }
        }
      });

      const completionRate =
        totalStudents > 0
          ? Number(((cleared / totalStudents) * 100).toFixed(2))
          : 0;

      return {
        sno,
        name,
        cleared,
        pending: pendingCount,
        requested,
        rejected,
        summoned: summonedCount,
        completionRate,
      };
    });

    return res.status(200).json({
      totalStudents,
      fullyCleared,
      inProgress,
      pending,
      summoned,
      blocked,
      totalDeductions,
      departmentStats,
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * ==================================================
 * Exports
 * ==================================================
 */

module.exports = {
  getMyClearance,
  requestClearance,
  officerAction,
  studentResponse,
  getOfficerQueue,
  getClearanceById,
  getAllClearances,
  getOfficerHistory,
  adminOverride,
  getAdminStats,
};

