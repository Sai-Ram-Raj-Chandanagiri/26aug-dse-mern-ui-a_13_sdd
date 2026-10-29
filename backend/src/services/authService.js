const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const PasswordResetToken = require("../models/RecoveryCredential");
const EmailVerificationCode = require("../models/EmailVerificationCode");
const { signSessionToken } = require("../utils/token");

const BCRYPT_COST = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_CODE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30min

// nodemailer console transport only (Constitution Principle I — no live SMTP, FR-006)
const mailTransport = nodemailer.createTransport({ streamTransport: true, buffer: true });

async function sendConsoleMail({ to, subject, text }) {
  const info = await mailTransport.sendMail({ from: "no-reply@roundtable.local", to, subject, text });
  // eslint-disable-next-line no-console
  console.log(`\n[mail:console] To: ${to} | Subject: ${subject}\n${text}\n`);
  return info;
}

function makeNumericCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

function hashOpaqueToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    role: userDoc.role,
    displayName: userDoc.displayName,
    bio: userDoc.bio,
    avatarUrl: userDoc.avatarUrl,
    isEmailVerified: userDoc.isEmailVerified,
    status: userDoc.status,
  };
}

class AuthError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function assertPasswordStrength(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      "WEAK_PASSWORD",
      400
    );
  }
}

// FR-001/FR-002/FR-006: register, reject duplicate emails, issue console-printed confirmation code
async function register({ email, password, displayName }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AuthError("Email already in use.", "EMAIL_IN_USE", 400);
  }

  assertPasswordStrength(password);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    displayName,
  });

  const code = makeNumericCode();
  await EmailVerificationCode.create({
    user: user._id,
    code,
    expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_MS),
  });

  await sendConsoleMail({
    to: user.email,
    subject: "Confirm your Roundtable account",
    text: `Your confirmation code is: ${code}`,
  });

  return { userId: user._id.toString() };
}

// FR-006: redeem a single-use, time-limited confirmation code
async function verifyEmail({ userId, code }) {
  const record = await EmailVerificationCode.findOne({
    user: userId,
    code,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new AuthError("Invalid or expired confirmation code.", "INVALID_OR_EXPIRED_CODE", 400);
  }

  record.usedAt = new Date();
  await record.save();

  await User.findByIdAndUpdate(userId, { isEmailVerified: true });

  return { verified: true };
}

// FR-003/FR-004: login, generic invalid-credentials error (never reveals which field was wrong)
async function login({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    throw new AuthError("Invalid email or password.", "INVALID_CREDENTIALS", 401);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AuthError("Invalid email or password.", "INVALID_CREDENTIALS", 401);
  }

  const token = signSessionToken({ sub: user._id.toString(), role: user.role });
  return { token, user: toPublicUser(user) };
}

// FR-005/FR-006: always responds the same way regardless of whether the account exists
async function requestPasswordReset({ email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const rawCode = makeNumericCode(8);
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashOpaqueToken(rawCode),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    await sendConsoleMail({
      to: user.email,
      subject: "Reset your Roundtable password",
      text: `Your password reset code is: ${rawCode}`,
    });
  }

  return null;
}

// FR-005: single-use, time-limited reset code redemption
async function resetPassword({ email, code, newPassword }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AuthError("Invalid or expired reset code.", "INVALID_OR_EXPIRED_TOKEN", 400);
  }

  const tokenHash = hashOpaqueToken(code);
  const record = await PasswordResetToken.findOne({
    user: user._id,
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw new AuthError("Invalid or expired reset code.", "INVALID_OR_EXPIRED_TOKEN", 400);
  }

  assertPasswordStrength(newPassword);

  record.usedAt = new Date();
  await record.save();

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await user.save();

  return null;
}

async function getSessionUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AuthError("Invalid or expired session.", "UNAUTHENTICATED", 401);
  }
  return toPublicUser(user);
}

module.exports = {
  AuthError,
  register,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  getSessionUser,
  toPublicUser,
};
