const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      required: true,
      enum: ["student", "officer", "admin"],
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    // Student-specific fields
    course: {
      type: String,
      trim: true,
      default: "",
    },

    admNo: {
      type: String,
      trim: true,
      default: "",
    },

    parentGuardianName: {
      type: String,
      trim: true,
      default: "",
    },

    permanentAddress: {
      type: String,
      trim: true,
      default: "",
    },

    phone1: {
      type: String,
      trim: true,
      default: "",
    },

    phone2: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfCompletion: {
      type: Date,
      default: null,
    },

    nationalId: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

/**
 * Hash password before saving
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Compare password
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Virtual: User initials
 */
userSchema.virtual("initials").get(function () {
  if (!this.fullName) return "";

  const parts = this.fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

module.exports = mongoose.model("User", userSchema);
