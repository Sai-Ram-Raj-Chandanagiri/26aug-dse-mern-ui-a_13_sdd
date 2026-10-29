const mongoose = require("mongoose");

// Invitation schema (data-model.md "Invitation") — compound-unique on (community, invitedUser)
// while status is "pending" enforces "already invited"/duplicate-invite rejection (FR-012)
const invitationSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

invitationSchema.index(
  { community: 1, invitedUser: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
invitationSchema.index({ invitedUser: 1, status: 1 });

module.exports = mongoose.model("Invitation", invitationSchema);
