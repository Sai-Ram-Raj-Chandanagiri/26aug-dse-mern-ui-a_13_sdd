const mongoose = require("mongoose");

// Discussion schema (data-model.md "Discussion") — `(community, createdAt desc)` powers paginated
// listing and the `$text` index powers community-scoped keyword search (FR-024)
const discussionSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 10000,
    },
    // `removed` content stays in the DB for audit but is excluded from normal listings
    status: {
      type: String,
      enum: ["active", "resolved", "removed"],
      default: "active",
    },
    // Denormalized counter maintained by Like create/remove (US7)
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

discussionSchema.index({ community: 1, createdAt: -1 });
discussionSchema.index({ title: "text", body: "text" });

module.exports = mongoose.model("Discussion", discussionSchema);
