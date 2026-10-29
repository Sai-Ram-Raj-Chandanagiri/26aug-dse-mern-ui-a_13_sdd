const notificationService = require("../services/notificationService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleNotificationError(res, err, next) {
  if (err instanceof notificationService.NotificationError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function list(req, res, next) {
  try {
    const result = await notificationService.listNotifications(req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleNotificationError(res, err, next);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    return sendSuccess(res, { data: { notification }, message: "" });
  } catch (err) {
    return handleNotificationError(res, err, next);
  }
}

async function getPreferences(req, res, next) {
  try {
    const preference = await notificationService.getPreferences(req.user.id);
    return sendSuccess(res, { data: { preference }, message: "" });
  } catch (err) {
    return handleNotificationError(res, err, next);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const preference = await notificationService.updatePreferences(req.user.id, req.body);
    return sendSuccess(res, { data: { preference }, message: "Preferences updated." });
  } catch (err) {
    return handleNotificationError(res, err, next);
  }
}

module.exports = {
  list,
  markRead,
  getPreferences,
  updatePreferences,
};
