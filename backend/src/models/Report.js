const mongoose = require("mongoose");

// Report schema (data-model.md "Report") — `hiddenForReporter` governs per-user hiding of the
// reported content only (Constitution Principle VI — never a global hide); the compound unique
// index blocks duplicate reports from the same user against the same content (FR-028).
const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["discussion", "resource", "comment"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "dismissed", "removed"],
      default: "pending",
    },
    hiddenForReporter: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
