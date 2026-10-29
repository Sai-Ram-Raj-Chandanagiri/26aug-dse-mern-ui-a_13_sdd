const mongoose = require("mongoose");

// Message schema (data-model.md "Message") — 1-on-1 chat message belonging to a Conversation;
// `readAt` stays null until the recipient opens the conversation (PATCH /read marks all unread
// messages addressed to the requester at once).
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Chronological history lookup
messageSchema.index({ conversation: 1, createdAt: 1 });
// Unread-badge computation
messageSchema.index({ conversation: 1, readAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
