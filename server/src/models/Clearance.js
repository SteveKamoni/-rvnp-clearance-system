// server/src/models/Clearance.js

const mongoose = require("mongoose");

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

const actionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      action: {
        type: String,
        enum: [
          "requested",
          "cleared",
          "rejected",
          "summoned",
          "student_response",
        ],
        required: true,
      },
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorRole: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const departmentSchema = new mongoose.Schema(
  {
    sno: {
      type: Number,
      required: true,
      min: 1,
      max: DEPARTMENTS.length,
    },

    name: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
      trim: true,
    },

    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "requested", "cleared", "rejected", "summoned"],
      default: "pending",
    },

    deductionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    requestedAt: {
      type: Date,
      default: null,
    },

    officerReason: {
      type: String,
      default: "",
      trim: true,
    },

    studentResponse: {
      type: String,
      default: "",
      trim: true,
    },

    studentRespondedAt: {
      type: Date,
      default: null,
    },

    statusUpdatedAt: {
      type: Date,
      default: null,
    },

    clearedAt: {
      type: Date,
      default: null,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    actionHistory: {
      type: [actionHistorySchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);
const clearanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    overallStatus: {
      type: String,
      enum: ["pending", "in_progress", "summoned", "blocked", "cleared"],
      default: "pending",
    },

    departments: {
      type: [departmentSchema],
      default: () =>
        DEPARTMENTS.map((name, index) => ({
          sno: index + 1,
          name,
          officerId: null,

          status: "pending",

          deductionAmount: 0,
          remarks: "",

          requestedAt: null,

          officerReason: "",

          studentResponse: "",
          studentRespondedAt: null,

          statusUpdatedAt: null,

          clearedAt: null,

          updatedAt: new Date(),

          actionHistory: [],
        })),

      validate: {
        validator: (value) => value.length === DEPARTMENTS.length,

        message: `A clearance record must contain exactly ${DEPARTMENTS.length} departments.`,
      },
    },

    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    clearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Adds an audit history entry to a department.
 *
 * @param {number} departmentIndex - Zero-based index of the department.
 * @param {Object} entry
 * @param {string} entry.action
 * @param {mongoose.Types.ObjectId|string} entry.actor
 * @param {string} entry.actorRole
 * @param {string} entry.reason
 * @returns {Object} Updated department
 */
clearanceSchema.methods.addDepartmentHistory = function (
  departmentIndex,
  { action, actor, actorRole, reason = "" },
) {
  const department = this.departments[departmentIndex];

  if (!department) {
    throw new Error("Invalid department index.");
  }

  const now = new Date();

  department.actionHistory.push({
    action,
    actor,
    actorRole,
    reason,
    timestamp: now,
  });

  department.statusUpdatedAt = now;

  return department;
};

/**
 * Keep department timestamps current.
 */
clearanceSchema.pre("save", function () {
  this.departments.forEach((department) => {
    department.updatedAt = new Date();

    if (department.status !== "pending" && !department.statusUpdatedAt) {
      department.statusUpdatedAt = new Date();
    }

    if (department.status === "requested" && !department.requestedAt) {
      department.requestedAt = new Date();
    }

    if (department.status === "cleared" && !department.clearedAt) {
      department.clearedAt = new Date();
    }

    if (department.status !== "cleared") {
      department.clearedAt = null;
    }
  });

  //   next();
});
/**
 * Recalculate derived values before saving.
 */
clearanceSchema.pre("save", function () {
  // Calculate total deductions
  this.totalDeductions = this.departments.reduce(
    (total, department) => total + (department.deductionAmount || 0),
    0,
  );

  const allCleared = this.departments.every(
    (department) => department.status === "cleared",
  );

  const anySummoned = this.departments.some(
    (department) => department.status === "summoned",
  );

  const anyRequested = this.departments.some(
    (department) => department.status === "requested",
  );

  const anyCleared = this.departments.some(
    (department) => department.status === "cleared",
  );

  const anyRejectedWithoutResponse = this.departments.some(
    (department) =>
      department.status === "rejected" && !department.studentResponse.trim(),
  );

  const anyTouched = this.departments.some(
    (department) => department.status !== "pending",
  );

  if (allCleared) {
    this.overallStatus = "cleared";

    if (!this.clearedAt) {
      this.clearedAt = new Date();
    }
  } else if (anySummoned) {
    this.overallStatus = "summoned";
    this.clearedAt = null;
  } else if (anyRejectedWithoutResponse) {
    this.overallStatus = "blocked";
    this.clearedAt = null;
  } else if (anyRequested || anyCleared) {
    this.overallStatus = "in_progress";
    this.clearedAt = null;
  } else if (!anyTouched) {
    this.overallStatus = "pending";
    this.clearedAt = null;
  } else {
    this.overallStatus = "in_progress";
    this.clearedAt = null;
  }

  //   next();
});

module.exports = mongoose.model("Clearance", clearanceSchema);
