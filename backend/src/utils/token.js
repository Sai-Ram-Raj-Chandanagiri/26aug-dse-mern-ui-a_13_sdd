const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Session JWT sign/verify (Constitution Principle I — httpOnly cookie delivery, never localStorage)
function signSessionToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signSessionToken, verifySessionToken };
