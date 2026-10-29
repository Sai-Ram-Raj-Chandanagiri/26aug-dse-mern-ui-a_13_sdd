const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const engagementService = require("./engagementService");

const UPLOADS_DIR = path.resolve(__dirname, "../../uploads/avatars");
const EXT_BY_MIME_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const EDITABLE_FIELDS = ["displayName", "bio"];

class UserError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
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

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserError("User not found.", "NOT_FOUND", 404);
  }
  return toPublicUser(user);
}

// FR-007: email and role are never accepted from the request, regardless of what the client sends
async function updateMe(userId, updates = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserError("User not found.", "NOT_FOUND", 404);
  }

  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      user[field] = updates[field];
    }
  }

  await user.save();
  return toPublicUser(user);
}

// FR-008: multer already rejects uploads over 5 MB / non-image mime types before this runs
async function uploadAvatar(userId, file) {
  if (!file) {
    throw new UserError("No file uploaded.", "VALIDATION_ERROR", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new UserError("User not found.", "NOT_FOUND", 404);
  }

  const ext = EXT_BY_MIME_TYPE[file.mimetype] || "bin";
  const filename = `${userId}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);

  user.avatarUrl = `/uploads/avatars/${filename}`;
  await user.save();

  return toPublicUser(user);
}

// FR-009: activity aggregation — later user-story models register themselves with mongoose as
// those features ship, so lookups are guarded to return 0 until each model exists.
async function getActivity(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const Discussion = mongoose.models.Discussion;
  const Membership = mongoose.models.Membership;
  const Community = mongoose.models.Community;

  const [discussionCount, membershipCount, ownedCommunityCount] = await Promise.all([
    Discussion ? Discussion.countDocuments({ author: userObjectId }) : Promise.resolve(0),
    Membership ? Membership.countDocuments({ user: userObjectId }) : Promise.resolve(0),
    Community ? Community.countDocuments({ owner: userObjectId }) : Promise.resolve(0),
  ]);

  return {
    discussionCount,
    communitiesJoined: membershipCount,
    communitiesOwned: ownedCommunityCount,
  };
}

// FR-027: delegates to engagementService's live-target resolution so the saved-items section
// never shows a bookmark whose target was admin-removed or deleted
async function getBookmarks(userId, query) {
  return engagementService.listBookmarks(userId, query);
}

module.exports = { UserError, getMe, updateMe, uploadAvatar, getActivity, getBookmarks, toPublicUser };
