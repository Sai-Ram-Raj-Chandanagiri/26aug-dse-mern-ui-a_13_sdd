const mongoose = require("mongoose");

// Comment schema (data-model.md "Comment") — `(discussion, createdAt asc)` gives chronological replies
const commentSchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
  },
  { timestamps: true }
);

commentSchema.index({ discussion: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
