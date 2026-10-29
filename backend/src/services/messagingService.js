const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Membership = require("../models/Membership");
const User = require("../models/User");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class MessagingError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function toPublicParticipant(userDoc) {
  if (!userDoc) return null;
  return {
    id: userDoc._id.toString(),
    displayName: userDoc.displayName,
    avatarUrl: userDoc.avatarUrl || null,
  };
}

function toPublicMessage(messageDoc) {
  return {
    id: messageDoc._id.toString(),
    conversation: messageDoc.conversation.toString(),
    sender: messageDoc.sender.toString(),
    body: messageDoc.body,
    readAt: messageDoc.readAt,
    createdAt: messageDoc.createdAt,
  };
}

// FR-030: creating a conversation requires the two users to share at least one active
// Membership; checked here (not at the schema level) since it requires cross-collection lookups.
async function assertSharedMembership(userId, recipientId) {
  const [userMemberships, recipientMemberships] = await Promise.all([
    Membership.find({ user: userId }, "community"),
    Membership.find({ user: recipientId }, "community"),
  ]);

  const recipientCommunityIds = new Set(recipientMemberships.map((m) => m.community.toString()));
  const sharesCommunity = userMemberships.some((m) => recipientCommunityIds.has(m.community.toString()));

  if (!sharesCommunity) {
    throw new MessagingError(
      "You must share a community with this user to start a conversation.",
      "NO_SHARED_COMMUNITY",
      403
    );
  }
}

async function assertParticipant(userId, conversation) {
  const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) {
    throw new MessagingError("You are not a participant in this conversation.", "FORBIDDEN", 403);
  }
}

async function findConversationOrThrow(conversationId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new MessagingError("Conversation not found.", "NOT_FOUND", 404);
  }
  return conversation;
}

// Returns the existing conversation between the pair if one exists, otherwise creates a new one
// (contracts/messaging.md: 201 for newly created, 200 for an existing match).
async function createOrFindConversation(userId, recipientUserId) {
  if (!recipientUserId || recipientUserId.toString() === userId.toString()) {
    throw new MessagingError("A valid recipientUserId is required.", "VALIDATION_ERROR", 400);
  }

  const recipient = await User.findById(recipientUserId);
  if (!recipient) {
    throw new MessagingError("Recipient not found.", "NOT_FOUND", 404);
  }

  await assertSharedMembership(userId, recipientUserId);

  const existing = await Conversation.findOne({
    participants: { $all: [userId, recipientUserId] },
  });
  if (existing) {
    return { conversation: await toPublicConversation(existing, userId), isNew: false };
  }

  const created = await Conversation.create({
    participants: [userId, recipientUserId],
    lastMessageAt: new Date(),
  });

  return { conversation: await toPublicConversation(created, userId), isNew: true };
}

async function toPublicConversation(conversationDoc, requesterId) {
  const otherParticipantId = conversationDoc.participants.find(
    (p) => p.toString() !== requesterId.toString()
  );
  const otherParticipant = await User.findById(otherParticipantId);

  const unreadCount = await Message.countDocuments({
    conversation: conversationDoc._id,
    sender: { $ne: requesterId },
    readAt: null,
  });

  return {
    id: conversationDoc._id.toString(),
    otherParticipant: toPublicParticipant(otherParticipant),
    lastMessageAt: conversationDoc.lastMessageAt,
    unreadCount,
    createdAt: conversationDoc.createdAt,
  };
}

// FR-031: paginated inbox ordered by `lastMessageAt desc`, each entry carrying the other
// participant's profile summary and an unread-count badge.
async function listConversations(userId, query = {}) {
  const { page, pageSize, skip, limit } = getPagination(query);
  const filter = { participants: userId };

  const [conversations, totalItems] = await Promise.all([
    Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit),
    Conversation.countDocuments(filter),
  ]);

  const items = await Promise.all(
    conversations.map((conversation) => toPublicConversation(conversation, userId))
  );

  return buildPaginatedResult({ items, page, pageSize, totalItems });
}

// Paginated chronological (`createdAt asc`) message history; display direction is a frontend concern.
async function listMessages(userId, conversationId, query = {}) {
  const conversation = await findConversationOrThrow(conversationId);
  await assertParticipant(userId, conversation);

  const { page, pageSize, skip, limit } = getPagination(query);
  const filter = { conversation: conversationId };

  const [messages, totalItems] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);

  return buildPaginatedResult({ items: messages.map(toPublicMessage), page, pageSize, totalItems });
}

// FR-031: empty/whitespace-only message bodies are rejected before persisting.
async function sendMessage(userId, conversationId, body) {
  const conversation = await findConversationOrThrow(conversationId);
  await assertParticipant(userId, conversation);

  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (!trimmedBody) {
    throw new MessagingError("Message body cannot be empty.", "EMPTY_MESSAGE", 400);
  }
  if (trimmedBody.length > 2000) {
    throw new MessagingError("Message body cannot exceed 2000 characters.", "VALIDATION_ERROR", 400);
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    body: trimmedBody,
  });

  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return toPublicMessage(message);
}

// Marks every message in the conversation not sent by the requester as read.
async function markRead(userId, conversationId) {
  const conversation = await findConversationOrThrow(conversationId);
  await assertParticipant(userId, conversation);

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return null;
}

module.exports = {
  MessagingError,
  createOrFindConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
};
