const { sendError } = require("../utils/responseEnvelope");

// Presence of a Membership document is the sole gate for community write access (Constitution Principle IV)
// Lazy-required: the Membership model is introduced alongside the Community/Membership feature tasks.
function requireCommunityMember(communityIdParam = "communityId") {
  return async function (req, res, next) {
    if (!req.user) {
      return sendError(res, { message: "Authentication required.", code: "UNAUTHENTICATED", statusCode: 401 });
    }

    const communityId = req.params[communityIdParam];
    try {
      const Membership = require("../models/Membership");
      const membership = await Membership.findOne({ user: req.user.id, community: communityId });
      if (!membership) {
        return sendError(res, { message: "Community membership required.", code: "FORBIDDEN", statusCode: 403 });
      }
      req.membership = membership;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = requireCommunityMember;
