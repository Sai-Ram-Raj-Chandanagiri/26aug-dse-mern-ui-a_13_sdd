const mongoose = require("mongoose");

// User schema (data-model.md "User") — email is immutable, role never public-settable (Constitution Principle I)
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 60,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
