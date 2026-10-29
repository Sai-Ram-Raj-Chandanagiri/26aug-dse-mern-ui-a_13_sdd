const mongoose = require("mongoose");

// Notification schema (data-model.md "Notification") — fan-out-on-write rows created when a
// member posts a new discussion/resource; `readAt` stays null until the recipient reads it (FR-022)
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    type: {
      type: String,
      enum: ["new_discussion", "new_resource"],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
