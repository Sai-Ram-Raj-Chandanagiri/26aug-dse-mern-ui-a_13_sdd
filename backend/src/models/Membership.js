const mongoose = require("mongoose");

// Membership schema (data-model.md "Membership") — presence of a document is the sole gate for
// discussion/resource write access to a community (Constitution Principle IV)
const membershipSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ["member", "admin", "owner"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, community: 1 }, { unique: true });
membershipSchema.index({ community: 1 });
membershipSchema.index({ user: 1 });

module.exports = mongoose.model("Membership", membershipSchema);
