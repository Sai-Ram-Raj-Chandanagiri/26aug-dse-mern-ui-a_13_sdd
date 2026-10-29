const mongoose = require("mongoose");

// Bookmark schema (data-model.md "Bookmark") — the compound unique index enforces one
// bookmark-per-user-per-item (FR-027); listing queries join against the live target and exclude
// bookmarks whose target was removed or no longer exists, rather than eagerly deleting bookmarks
// on content removal.
const bookmarkSchema = new mongoose.Schema(
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

bookmarkSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
