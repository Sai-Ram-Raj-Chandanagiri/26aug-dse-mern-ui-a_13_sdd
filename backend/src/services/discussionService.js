const Discussion = require("../models/Discussion");
const Comment = require("../models/Comment");
const Community = require("../models/Community");
const Membership = require("../models/Membership");
const Report = require("../models/Report");
const notificationService = require("./notificationService");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class DiscussionError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function toPublicAuthor(author) {
  if (!author) return null;
  if (author.displayName === undefined) return author.toString();
  return {
    id: author._id.toString(),
    displayName: author.displayName,
    avatarUrl: author.avatarUrl || null,
  };
}

function toPublicDiscussion(discussionDoc) {
  return {
    id: discussionDoc._id.toString(),
    community: discussionDoc.community.toString(),
    author: toPublicAuthor(discussionDoc.author),
    title: discussionDoc.title,
    body: discussionDoc.body,
    status: discussionDoc.status,
    likeCount: discussionDoc.likeCount,
    createdAt: discussionDoc.createdAt,
  };
}

function toPublicComment(commentDoc) {
  return {
    id: commentDoc._id.toString(),
    discussion: commentDoc.discussion.toString(),
    author: toPublicAuthor(commentDoc.author),
    body: commentDoc.body,
    status: commentDoc.status,
    createdAt: commentDoc.createdAt,
  };
}

// Private communities return 404 (never 403) to non-members so existence is not leaked
async function assertCommunityReadable(communityId, userId) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new DiscussionError("Community not found.", "NOT_FOUND", 404);
  }

  if (community.visibility === "private") {
    const membership = await Membership.findOne({ user: userId, community: community._id });
    if (!membership) {
      throw new DiscussionError("Community not found.", "NOT_FOUND", 404);
    }
  }

  return community;
}

// Principle VI: content a user reported is hidden only for that user, never globally — collect
// the `hiddenForReporter` target ids for this user/targetType and exclude them from their own query
async function reportedTargetIds(userId, targetType) {
  const reports = await Report.find({ reporter: userId, targetType, hiddenForReporter: true }, "targetId");
  return reports.map((report) => report.targetId);
}

// FR-024/FR-025: keyword filtering happens inside the query; an empty match still returns 200
async function listDiscussions(communityId, userId, query = {}) {
  await assertCommunityReadable(communityId, userId);

  const { page, pageSize, skip, limit } = getPagination(query);
  const keyword = typeof query.query === "string" ? query.query.trim() : "";
  const hiddenIds = await reportedTargetIds(userId, "discussion");

  const filter = { community: communityId, status: { $ne: "removed" } };
  if (hiddenIds.length > 0) {
    filter._id = { $nin: hiddenIds };
  }
  let sort = { createdAt: -1 };
  if (keyword) {
    filter.$text = { $search: keyword };
    sort = { score: { $meta: "textScore" }, createdAt: -1 };
  }

  const baseQuery = Discussion.find(filter);
  if (keyword) {
    baseQuery.select({ score: { $meta: "textScore" } });
  }

  const [discussions, totalItems] = await Promise.all([
    baseQuery.sort(sort).skip(skip).limit(limit).populate("author", "displayName avatarUrl"),
    Discussion.countDocuments(filter),
  ]);

  return buildPaginatedResult({
    items: discussions.map(toPublicDiscussion),
    page,
    pageSize,
    totalItems,
  });
}

// FR-015: membership is enforced by `requireCommunityMember` on the route, re-checked here so the
// service is safe to call from other contexts
async function createDiscussion(communityId, userId, { title, body }) {
  const membership = await Membership.findOne({ user: userId, community: communityId });
  if (!membership) {
    throw new DiscussionError("Community membership required.", "NOT_A_MEMBER", 403);
  }

  const discussion = await Discussion.create({
    community: communityId,
    author: userId,
    title: title.trim(),
    body: body.trim(),
  });

  await discussion.populate("author", "displayName avatarUrl");

  // US7 fan-out: notify other current members of this community (FR-022)
  await notificationService.fanOutNewContent({
    communityId,
    authorId: userId,
    type: "new_discussion",
    refId: discussion._id,
  });

  return toPublicDiscussion(discussion);
}

async function getDiscussionById(discussionId, userId, query = {}) {
  const discussion = await Discussion.findOne({ _id: discussionId, status: { $ne: "removed" } }).populate(
    "author",
    "displayName avatarUrl"
  );
  if (!discussion) {
    throw new DiscussionError("Discussion not found.", "NOT_FOUND", 404);
  }

  await assertCommunityReadable(discussion.community, userId);

  const { page, pageSize, skip, limit } = getPagination(query);
  const hiddenCommentIds = await reportedTargetIds(userId, "comment");
  const commentFilter = { discussion: discussion._id, status: "active" };
  if (hiddenCommentIds.length > 0) {
    commentFilter._id = { $nin: hiddenCommentIds };
  }

  const [comments, totalItems, membership] = await Promise.all([
    Comment.find(commentFilter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "displayName avatarUrl"),
    Comment.countDocuments(commentFilter),
    Membership.findOne({ user: userId, community: discussion.community }),
  ]);

  return {
    discussion: toPublicDiscussion(discussion),
    isMember: Boolean(membership),
    comments: buildPaginatedResult({
      items: comments.map(toPublicComment),
      page,
      pageSize,
      totalItems,
    }),
  };
}

async function addComment(discussionId, userId, { body }) {
  const discussion = await Discussion.findOne({ _id: discussionId, status: { $ne: "removed" } });
  if (!discussion) {
    throw new DiscussionError("Discussion not found.", "NOT_FOUND", 404);
  }

  const membership = await Membership.findOne({ user: userId, community: discussion.community });
  if (!membership) {
    throw new DiscussionError("Community membership required.", "NOT_A_MEMBER", 403);
  }

  const comment = await Comment.create({
    discussion: discussion._id,
    author: userId,
    body: body.trim(),
  });

  await comment.populate("author", "displayName avatarUrl");
  return toPublicComment(comment);
}

module.exports = {
  DiscussionError,
  toPublicDiscussion,
  toPublicComment,
  listDiscussions,
  createDiscussion,
  getDiscussionById,
  addComment,
};
