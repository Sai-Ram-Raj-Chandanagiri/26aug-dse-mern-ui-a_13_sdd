const userService = require("../services/userService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleUserError(res, err, next) {
  if (err instanceof userService.UserError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.id);
    return sendSuccess(res, { data: { user }, message: "" });
  } catch (err) {
    return handleUserError(res, err, next);
  }
}

async function updateMe(req, res, next) {
  try {
    // email/role are stripped server-side in userService regardless of what's in req.body (FR-007)
    const user = await userService.updateMe(req.user.id, req.body);
    return sendSuccess(res, { data: { user }, message: "Profile updated." });
  } catch (err) {
    return handleUserError(res, err, next);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    const user = await userService.uploadAvatar(req.user.id, req.file);
    return sendSuccess(res, { data: { user }, message: "Profile picture updated." });
  } catch (err) {
    return handleUserError(res, err, next);
  }
}

async function getActivity(req, res, next) {
  try {
    const activity = await userService.getActivity(req.user.id);
    return sendSuccess(res, { data: { activity }, message: "" });
  } catch (err) {
    return handleUserError(res, err, next);
  }
}

async function getBookmarks(req, res, next) {
  try {
    const result = await userService.getBookmarks(req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleUserError(res, err, next);
  }
}

module.exports = { getMe, updateMe, uploadAvatar, getActivity, getBookmarks };
