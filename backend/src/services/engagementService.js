const Like = require("../models/Like");
const Bookmark = require("../models/Bookmark");
const Discussion = require("../models/Discussion");
const Resource = require("../models/Resource");
const Membership = require("../models/Membership");
const { toPublicDiscussion } = require("./discussionService");
const { toPublicResource } = require("./resourceService");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class EngagementError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Polymorphic target resolution — targetType picks the collection a Like/Bookmark's targetId
// belongs to
const TARGET_MODELS = {
  discussion: Discussion,
  resource: Resource,
};

const TARGET_PUBLIC_MAPPERS = {
  discussion: toPublicDiscussion,
  resource: toPublicResource,
};

async function findTarget(targetType, targetId) {
  const Model = TARGET_MODELS[targetType];
  if (!Model) {
    throw new EngagementError("Invalid target type.", "VALIDATION_ERROR", 400);
  }

  const target = await Model.findOne({ _id: targetId, status: { $ne: "removed" } });
  if (!target) {
    throw new EngagementError("Content not found.", "NOT_FOUND", 404);
  }

  return { Model, target };
}

// FR-026 limits liking to community members, mirroring the membership re-check other services do
async function assertMember(userId, communityId) {
  const membership = await Membership.findOne({ user: userId, community: communityId });
  if (!membership) {
    throw new EngagementError("Community membership required.", "NOT_A_MEMBER", 403);
  }
}

// `likeCount` is denormalized on the target, so it is only ever adjusted alongside a Like document
// that was actually created/deleted — never on a duplicate or no-op unlike.
async function adjustLikeCount(Model, targetId, delta) {
  const updated = await Model.findByIdAndUpdate(
    targetId,
    { $inc: { likeCount: delta } },
    { new: true, select: "likeCount" }
  );
  return Math.max(0, updated?.likeCount ?? 0);
}

// FR-026: the compound unique index — not a read-then-write check — is what makes two simultaneous
// likes from the same user collapse into exactly one Like document.
async function like(userId, { targetType, targetId }) {
  const { Model, target } = await findTarget(targetType, targetId);
  await assertMember(userId, target.community);

  try {
    await Like.create({ user: userId, targetType, targetId });
  } catch (err) {
    if (err?.code === 11000) {
      throw new EngagementError("You have already liked this content.", "DUPLICATE_LIKE", 400);
    }
    throw err;
  }

  return { likeCount: await adjustLikeCount(Model, targetId, 1) };
}

async function unlike(userId, { targetType, targetId }) {
  const { Model, target } = await findTarget(targetType, targetId);
  await assertMember(userId, target.community);

  const deleted = await Like.findOneAndDelete({ user: userId, targetType, targetId });
  if (!deleted) {
    return { likeCount: Math.max(0, target.likeCount ?? 0) };
  }

  return { likeCount: await adjustLikeCount(Model, targetId, -1) };
}

function toPublicBookmark(bookmarkDoc) {
  return {
    id: bookmarkDoc._id.toString(),
    targetType: bookmarkDoc.targetType,
    targetId: bookmarkDoc.targetId.toString(),
    createdAt: bookmarkDoc.createdAt,
  };
}

// FR-027: saving does not require community membership — a user can only reach a target's id
// through a surface they are already authorized to view, so `findTarget` (existence + not-removed)
// is the only check needed here.
async function createBookmark(userId, { targetType, targetId }) {
  await findTarget(targetType, targetId);

  let bookmark;
  try {
    bookmark = await Bookmark.create({ user: userId, targetType, targetId });
  } catch (err) {
    if (err?.code === 11000) {
      throw new EngagementError("You have already saved this content.", "DUPLICATE_BOOKMARK", 400);
    }
    throw err;
  }

  return toPublicBookmark(bookmark);
}

// Removal is scoped to the owning user so one member cannot remove another's bookmark by id
async function removeBookmark(userId, bookmarkId) {
  const deleted = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: userId });
  if (!deleted) {
    throw new EngagementError("Bookmark not found.", "NOT_FOUND", 404);
  }
  return null;
}

// FR-027: resolves each Bookmark against its live target, excluding any whose target was removed
// or no longer exists, rather than eagerly deleting the Bookmark document on content removal.
async function listBookmarks(userId, query = {}) {
  const { page, pageSize, skip, limit } = getPagination(query);
  const requestedType = typeof query.targetType === "string" ? query.targetType : "";

  const filter = { user: userId };
  if (TARGET_MODELS[requestedType]) {
    filter.targetType = requestedType;
  }

  const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });

  // Batch-resolve live targets per type instead of one query per bookmark
  const idsByType = {};
  for (const bookmarkDoc of bookmarks) {
    (idsByType[bookmarkDoc.targetType] ||= []).push(bookmarkDoc.targetId);
  }

  const targetsByTypeAndId = {};
  for (const [type, ids] of Object.entries(idsByType)) {
    const Model = TARGET_MODELS[type];
    const docs = await Model.find({ _id: { $in: ids }, status: { $ne: "removed" } }).populate(
      "author",
      "displayName avatarUrl"
    );
    targetsByTypeAndId[type] = new Map(docs.map((doc) => [doc._id.toString(), doc]));
  }

  const resolved = [];
  for (const bookmarkDoc of bookmarks) {
    const target = targetsByTypeAndId[bookmarkDoc.targetType]?.get(bookmarkDoc.targetId.toString());
    if (!target) continue; // target removed/deleted — hidden per FR-027
    resolved.push({
      ...toPublicBookmark(bookmarkDoc),
      target: TARGET_PUBLIC_MAPPERS[bookmarkDoc.targetType](target),
    });
  }

  const totalItems = resolved.length;
  const items = resolved.slice(skip, skip + limit);

  return buildPaginatedResult({ items, page, pageSize, totalItems });
}

module.exports = {
  EngagementError,
  like,
  unlike,
  createBookmark,
  removeBookmark,
  listBookmarks,
};
