const mongoose = require("mongoose");

// Like schema (data-model.md "Like") — the compound unique index is the single source of truth for
// one-like-per-user-per-item (FR-026); removing the document represents "unlike" and decrements the
// target's denormalized `likeCount`.
const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["discussion", "resource"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
