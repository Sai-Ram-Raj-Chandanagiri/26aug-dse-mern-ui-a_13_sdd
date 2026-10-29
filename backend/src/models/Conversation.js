const mongoose = require("mongoose");

// Conversation schema (data-model.md "Conversation") — a 2-participant pairing; the shared-
// Membership check (FR-030) happens in messagingService, not here, since it requires querying
// across the Membership collection rather than a schema-level constraint.
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2,
        message: "A conversation must have exactly 2 participants.",
      },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Multikey index used to find/avoid duplicate conversations between the same pair of users
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
