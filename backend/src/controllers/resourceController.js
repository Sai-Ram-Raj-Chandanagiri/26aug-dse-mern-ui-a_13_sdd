const resourceService = require("../services/resourceService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleResourceError(res, err, next) {
  if (err instanceof resourceService.ResourceError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function listResources(req, res, next) {
  try {
    const result = await resourceService.listResources(req.params.communityId, req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleResourceError(res, err, next);
  }
}

async function createResource(req, res, next) {
  try {
    const resource = await resourceService.createResource(
      req.params.communityId,
      req.user.id,
      req.body,
      req.file
    );
    return sendSuccess(res, { data: { resource }, message: "Resource shared.", statusCode: 201 });
  } catch (err) {
    return handleResourceError(res, err, next);
  }
}

async function getResourceById(req, res, next) {
  try {
    const resource = await resourceService.getResourceById(req.params.id, req.user.id);
    return sendSuccess(res, { data: { resource }, message: "" });
  } catch (err) {
    return handleResourceError(res, err, next);
  }
}

module.exports = {
  listResources,
  createResource,
  getResourceById,
};
