const env = require("../config/env");
const authService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

// Parses simple "<n><unit>" durations (d/h/m/s) used by env.jwtExpiresIn into milliseconds,
// so the session cookie's maxAge always matches the JWT's own expiry.
function durationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(String(duration).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]];
  return value * unitMs;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: durationToMs(env.jwtExpiresIn),
    path: "/",
  };
}

function handleAuthError(res, err, next) {
  if (err instanceof authService.AuthError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body;
    const { userId } = await authService.register({ email, password, displayName });
    return sendSuccess(res, {
      data: { userId },
      message: "Registration successful. Check your confirmation code (printed to server console).",
      statusCode: 201,
    });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { userId, code } = req.body;
    const result = await authService.verifyEmail({ userId, code });
    return sendSuccess(res, { data: result, message: "Email verified." });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });
    res.cookie(env.cookieName, token, sessionCookieOptions());
    return sendSuccess(res, { data: { user }, message: "Logged in." });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

async function logout(req, res) {
  res.clearCookie(env.cookieName, { httpOnly: true, sameSite: "lax", secure: env.nodeEnv === "production", path: "/" });
  return sendSuccess(res, { data: null, message: "Logged out." });
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset({ email });
    return sendSuccess(res, { data: null, message: "If that account exists, a reset code was sent." });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    await authService.resetPassword({ email, code, newPassword });
    return sendSuccess(res, { data: null, message: "Password updated." });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

async function session(req, res, next) {
  try {
    const user = await authService.getSessionUser(req.user.id);
    return sendSuccess(res, { data: { user }, message: "" });
  } catch (err) {
    return handleAuthError(res, err, next);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  session,
};
