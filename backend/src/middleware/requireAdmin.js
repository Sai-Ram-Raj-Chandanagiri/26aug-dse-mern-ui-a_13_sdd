const { sendError } = require("../utils/responseEnvelope");

// Gates admin-only routes server-side via User.role (Constitution Principle I — never UI-only)
function requireAdmin(req, res, next) {
  if (!req.user) {
    return sendError(res, { message: "Authentication required.", code: "UNAUTHENTICATED", statusCode: 401 });
  }
  if (req.user.role !== "admin") {
    return sendError(res, { message: "Admin access required.", code: "FORBIDDEN", statusCode: 403 });
  }
  return next();
}

module.exports = requireAdmin;
