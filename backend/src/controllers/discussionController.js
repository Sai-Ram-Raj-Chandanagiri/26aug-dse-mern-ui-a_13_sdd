const discussionService = require("../services/discussionService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleDiscussionError(res, err, next) {
  if (err instanceof discussionService.DiscussionError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function listDiscussions(req, res, next) {
  try {
    const result = await discussionService.listDiscussions(req.params.communityId, req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleDiscussionError(res, err, next);
  }
}

async function createDiscussion(req, res, next) {
  try {
    const discussion = await discussionService.createDiscussion(req.params.communityId, req.user.id, req.body);
    return sendSuccess(res, { data: { discussion }, message: "Posted.", statusCode: 201 });
  } catch (err) {
    return handleDiscussionError(res, err, next);
  }
}

async function getDiscussionById(req, res, next) {
  try {
    const result = await discussionService.getDiscussionById(req.params.id, req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleDiscussionError(res, err, next);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await discussionService.addComment(req.params.id, req.user.id, req.body);
    return sendSuccess(res, { data: { comment }, message: "Reply posted.", statusCode: 201 });
  } catch (err) {
    return handleDiscussionError(res, err, next);
  }
}

module.exports = {
  listDiscussions,
  createDiscussion,
  getDiscussionById,
  addComment,
};
