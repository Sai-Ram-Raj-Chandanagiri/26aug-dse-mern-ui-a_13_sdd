const messagingService = require("../services/messagingService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleMessagingError(res, err, next) {
  if (err instanceof messagingService.MessagingError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function createConversation(req, res, next) {
  try {
    const { conversation, isNew } = await messagingService.createOrFindConversation(
      req.user.id,
      req.body.recipientUserId
    );
    return sendSuccess(res, {
      data: { conversation },
      message: isNew ? "Conversation started." : "Conversation found.",
      statusCode: isNew ? 201 : 200,
    });
  } catch (err) {
    return handleMessagingError(res, err, next);
  }
}

async function listConversations(req, res, next) {
  try {
    const result = await messagingService.listConversations(req.user.id, req.query);
    return sendSuccess(res, { data: result });
  } catch (err) {
    return handleMessagingError(res, err, next);
  }
}

async function listMessages(req, res, next) {
  try {
    const result = await messagingService.listMessages(req.user.id, req.params.id, req.query);
    return sendSuccess(res, { data: result });
  } catch (err) {
    return handleMessagingError(res, err, next);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.sendMessage(req.user.id, req.params.id, req.body.body);
    return sendSuccess(res, { data: { message }, message: "Sent.", statusCode: 201 });
  } catch (err) {
    return handleMessagingError(res, err, next);
  }
}

async function markRead(req, res, next) {
  try {
    await messagingService.markRead(req.user.id, req.params.id);
    return sendSuccess(res, { data: null, message: "Marked as read." });
  } catch (err) {
    return handleMessagingError(res, err, next);
  }
}

module.exports = {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
};
