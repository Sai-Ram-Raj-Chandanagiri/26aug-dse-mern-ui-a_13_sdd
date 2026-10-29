const adminService = require("../services/adminService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleAdminError(res, err, next) {
  if (err instanceof adminService.AdminError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function updateCommunity(req, res, next) {
  try {
    const community = await adminService.updateCommunity(req.params.id, req.body);
    return sendSuccess(res, { data: { community }, message: "Community updated." });
  } catch (err) {
    return handleAdminError(res, err, next);
  }
}

async function deleteCommunity(req, res, next) {
  try {
    const force = req.query.force === "true" || req.query.force === true;
    await adminService.deleteCommunity(req.params.id, { force });
    return sendSuccess(res, { data: null, message: "Community deleted." });
  } catch (err) {
    return handleAdminError(res, err, next);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    return sendSuccess(res, { data: { user }, message: "User updated." });
  } catch (err) {
    return handleAdminError(res, err, next);
  }
}

async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUser(req.params.id);
    return sendSuccess(res, { data: null, message: "User deleted." });
  } catch (err) {
    return handleAdminError(res, err, next);
  }
}

async function transferOwnership(req, res, next) {
  try {
    const community = await adminService.transferOwnership(req.params.id, req.body.newOwnerId);
    return sendSuccess(res, { data: { community }, message: "Ownership transferred." });
  } catch (err) {
    return handleAdminError(res, err, next);
  }
}

module.exports = {
  updateCommunity,
  deleteCommunity,
  updateUser,
  deleteUser,
  transferOwnership,
};
