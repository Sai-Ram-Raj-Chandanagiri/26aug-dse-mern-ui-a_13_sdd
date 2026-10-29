const mongoose = require("mongoose");

// NotificationPreference schema (data-model.md "NotificationPreference") — one document per user;
// every category defaults to enabled but may all be set `false` simultaneously (FR-023), with no
// server-side minimum enforced.
const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    newDiscussion: {
      type: Boolean,
      default: true,
    },
    newResource: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationPreference", notificationPreferenceSchema);
