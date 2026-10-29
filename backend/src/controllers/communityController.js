const communityService = require("../services/communityService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleCommunityError(res, err, next) {
  if (err instanceof communityService.CommunityError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function createCommunity(req, res, next) {
  try {
    const community = await communityService.createCommunity(req.user.id, req.body);
    return sendSuccess(res, { data: { community }, message: "Community created.", statusCode: 201 });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function updateCommunity(req, res, next) {
  try {
    const community = await communityService.updateCommunity(req.params.id, req.user.id, req.body);
    return sendSuccess(res, { data: { community }, message: "Community updated." });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function getCommunityById(req, res, next) {
  try {
    const community = await communityService.getCommunityById(req.params.id, req.user.id);
    return sendSuccess(res, { data: { community }, message: "" });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function searchCommunities(req, res, next) {
  try {
    const result = await communityService.searchCommunities(req.user.id, req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function joinCommunity(req, res, next) {
  try {
    const membership = await communityService.joinCommunity(req.params.id, req.user.id);
    return sendSuccess(res, { data: { membership }, message: "Joined community." });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function invite(req, res, next) {
  try {
    const invitation = await communityService.invite(req.params.id, req.user.id, req.body.invitedUserEmail);
    return sendSuccess(res, { data: { invitation }, message: "Invitation sent.", statusCode: 201 });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function listMyInvitations(req, res, next) {
  try {
    const invitations = await communityService.listMyInvitations(req.user.id);
    return sendSuccess(res, { data: { invitations }, message: "" });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const membership = await communityService.acceptInvitation(req.params.invitationId, req.user.id);
    return sendSuccess(res, { data: { membership }, message: "Invitation accepted." });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

async function declineInvitation(req, res, next) {
  try {
    await communityService.declineInvitation(req.params.invitationId, req.user.id);
    return sendSuccess(res, { data: null, message: "Invitation declined." });
  } catch (err) {
    return handleCommunityError(res, err, next);
  }
}

module.exports = {
  createCommunity,
  updateCommunity,
  getCommunityById,
  searchCommunities,
  joinCommunity,
  invite,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
};
