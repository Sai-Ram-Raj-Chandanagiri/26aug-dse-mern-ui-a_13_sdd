const engagementService = require("../services/engagementService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleEngagementError(res, err, next) {
  if (err instanceof engagementService.EngagementError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function like(req, res, next) {
  try {
    const result = await engagementService.like(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: "Liked.", statusCode: 201 });
  } catch (err) {
    return handleEngagementError(res, err, next);
  }
}

async function unlike(req, res, next) {
  try {
    const result = await engagementService.unlike(req.user.id, req.body);
    return sendSuccess(res, { data: result, message: "Unliked." });
  } catch (err) {
    return handleEngagementError(res, err, next);
  }
}

async function createBookmark(req, res, next) {
  try {
    const bookmark = await engagementService.createBookmark(req.user.id, req.body);
    return sendSuccess(res, { data: { bookmark }, message: "Saved.", statusCode: 201 });
  } catch (err) {
    return handleEngagementError(res, err, next);
  }
}

async function removeBookmark(req, res, next) {
  try {
    await engagementService.removeBookmark(req.user.id, req.params.id);
    return sendSuccess(res, { data: null, message: "Removed from saved items." });
  } catch (err) {
    return handleEngagementError(res, err, next);
  }
}

module.exports = {
  like,
  unlike,
  createBookmark,
  removeBookmark,
};
