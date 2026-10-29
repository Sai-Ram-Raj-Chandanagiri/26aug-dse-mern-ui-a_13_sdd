const mongoose = require("mongoose");

// Resource schema (data-model.md "Resource") — `(community, createdAt desc)` powers paginated
// listing, `(community, type)` powers the FR-024 type filter, and the `$text` index on `title`
// powers community-scoped keyword search.
const resourceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["article", "video", "link", "file"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    // Required for article/video/link; absent for file
    url: {
      type: String,
      trim: true,
    },
    // Set when `type = file`; served from the local uploads static mount
    fileUrl: {
      type: String,
    },
    // Recorded for uploaded files, validated <= 10,485,760 bytes server-side before this is set
    fileSizeBytes: {
      type: Number,
    },
    // `removed` content stays in the DB for audit but is excluded from normal listings
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
    // Denormalized counter maintained by Like create/remove (US9)
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ community: 1, createdAt: -1 });
resourceSchema.index({ community: 1, type: 1 });
resourceSchema.index({ title: "text" });

module.exports = mongoose.model("Resource", resourceSchema);
