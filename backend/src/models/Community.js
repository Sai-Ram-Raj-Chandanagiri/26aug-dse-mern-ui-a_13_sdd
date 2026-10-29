const mongoose = require("mongoose");

// Community schema (data-model.md "Community") — name uniqueness + $text search power FR-011/FR-016
const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Denormalized counter maintained by Membership create/remove hooks (data-model.md)
    memberCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

communitySchema.index({ name: "text", description: "text" });
communitySchema.index({ visibility: 1, name: 1 });

module.exports = mongoose.model("Community", communitySchema);
