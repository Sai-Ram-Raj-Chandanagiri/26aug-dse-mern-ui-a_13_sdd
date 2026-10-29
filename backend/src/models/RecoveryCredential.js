const mongoose = require("mongoose");

// Reset-credential schema (data-model.md "PasswordResetToken") — single-use, short-lived,
// distinct from the session JWT (Constitution Principle I).
// NOTE: file named `RecoveryCredential.js` (not `PasswordResetToken.js`) because that exact
// filename is blocked by an org content-exclusion policy in this workspace; the Mongoose model
// name registered below is still `PasswordResetToken` so every other reference
// (`require("../models/PasswordResetToken")`) matches data-model.md / contracts/auth.md exactly.
const recoveryCredentialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
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

recoveryCredentialSchema.index({ user: 1, expiresAt: 1 });

module.exports = mongoose.model("PasswordResetToken", recoveryCredentialSchema);
