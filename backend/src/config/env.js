const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Centralized environment config (Constitution: Security & Identity Integrity — JWT secret, cookie settings)
const env = {
  port: Number(requireEnv("RTB_PORT", "5000")),
  mongoUri: requireEnv("RTB_MONGO_URI", "mongodb://127.0.0.1:27017/roundtable"),
  jwtSecret: requireEnv("RTB_JWT_SECRET", "dev-only-insecure-secret"),
  jwtExpiresIn: requireEnv("RTB_JWT_EXPIRES_IN", "7d"),
  cookieName: requireEnv("RTB_COOKIE_NAME", "rtb_session"),
  clientOrigin: requireEnv("RTB_CLIENT_ORIGIN", "http://localhost:5173"),
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = env;
