const mongoose = require("mongoose");

// EmailVerificationCode schema (data-model.md "EmailVerificationCode") — short-lived confirmation
// code printed to console via nodemailer console transport (Constitution Principle I)
const emailVerificationCodeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emailVerificationCodeSchema.index({ user: 1, expiresAt: 1 });

module.exports = mongoose.model("EmailVerificationCode", emailVerificationCodeSchema);
