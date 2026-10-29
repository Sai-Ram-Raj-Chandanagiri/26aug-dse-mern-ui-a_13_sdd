const env = require("../config/env");
const { verifySessionToken } = require("../utils/token");
const { sendError } = require("../utils/responseEnvelope");

// Requires a valid session JWT delivered via httpOnly/SameSite cookie (Constitution Principle I)
function authRequired(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) {
    return sendError(res, { message: "Authentication required.", code: "UNAUTHENTICATED", statusCode: 401 });
  }

  try {
    const payload = verifySessionToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (_err) {
    return sendError(res, { message: "Invalid or expired session.", code: "UNAUTHENTICATED", statusCode: 401 });
  }
}

module.exports = authRequired;
