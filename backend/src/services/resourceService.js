const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Resource = require("../models/Resource");
const Community = require("../models/Community");
const Membership = require("../models/Membership");
const Report = require("../models/Report");
const notificationService = require("./notificationService");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

const UPLOADS_DIR = path.resolve(__dirname, "../../uploads/resources");
const RESOURCE_FILE_MAX_BYTES = 10 * 1024 * 1024;
const LINK_TYPES = new Set(["article", "video", "link"]);
const EXT_BY_MIME_TYPE = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "text/plain": "txt",
  "application/zip": "zip",
};

class ResourceError extends Error {
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

function toPublicResource(resourceDoc) {
  return {
    id: resourceDoc._id.toString(),
    community: resourceDoc.community.toString(),
    author: toPublicAuthor(resourceDoc.author),
    type: resourceDoc.type,
    title: resourceDoc.title,
    url: resourceDoc.url || null,
    fileUrl: resourceDoc.fileUrl || null,
    fileSizeBytes: resourceDoc.fileSizeBytes || null,
    status: resourceDoc.status,
    likeCount: resourceDoc.likeCount,
    createdAt: resourceDoc.createdAt,
  };
}

// Private communities return 404 (never 403) to non-members so existence is not leaked
async function assertCommunityReadable(communityId, userId) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new ResourceError("Community not found.", "NOT_FOUND", 404);
  }

  if (community.visibility === "private") {
    const membership = await Membership.findOne({ user: userId, community: community._id });
    if (!membership) {
      throw new ResourceError("Community not found.", "NOT_FOUND", 404);
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

// FR-024/FR-025: keyword + type filtering happen inside the query; an empty match still returns 200
async function listResources(communityId, userId, query = {}) {
  await assertCommunityReadable(communityId, userId);

  const { page, pageSize, skip, limit } = getPagination(query);
  const keyword = typeof query.query === "string" ? query.query.trim() : "";
  const type = typeof query.type === "string" ? query.type.trim() : "";
  const hiddenIds = await reportedTargetIds(userId, "resource");

  const filter = { community: communityId, status: { $ne: "removed" } };
  if (hiddenIds.length > 0) {
    filter._id = { $nin: hiddenIds };
  }
  if (type) {
    filter.type = type;
  }

  let sort = { createdAt: -1 };
  if (keyword) {
    filter.$text = { $search: keyword };
    sort = { score: { $meta: "textScore" }, createdAt: -1 };
  }

  const baseQuery = Resource.find(filter);
  if (keyword) {
    baseQuery.select({ score: { $meta: "textScore" } });
  }

  const [resources, totalItems] = await Promise.all([
    baseQuery.sort(sort).skip(skip).limit(limit).populate("author", "displayName avatarUrl"),
    Resource.countDocuments(filter),
  ]);

  return buildPaginatedResult({
    items: resources.map(toPublicResource),
    page,
    pageSize,
    totalItems,
  });
}

// FR-017: membership is enforced by `requireCommunityMember` on the route, re-checked here so the
// service is safe to call from other contexts
async function createResource(communityId, userId, { type, title, url }, file) {
  const membership = await Membership.findOne({ user: userId, community: communityId });
  if (!membership) {
    throw new ResourceError("Community membership required.", "NOT_A_MEMBER", 403);
  }

  if (!LINK_TYPES.has(type) && type !== "file") {
    throw new ResourceError("Invalid resource type.", "VALIDATION_ERROR", 400);
  }

  const payload = {
    community: communityId,
    author: userId,
    type,
    title: title.trim(),
  };

  if (type === "file") {
    if (!file) {
      throw new ResourceError("A file upload is required for this resource type.", "VALIDATION_ERROR", 400);
    }
    if (file.size > RESOURCE_FILE_MAX_BYTES) {
      throw new ResourceError("Upload exceeds the maximum allowed file size.", "OVERSIZED_UPLOAD", 413);
    }

    const ext = EXT_BY_MIME_TYPE[file.mimetype] || "bin";
    const filename = `${communityId}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);

    payload.fileUrl = `/uploads/resources/${filename}`;
    payload.fileSizeBytes = file.size;
  } else {
    if (!url || !url.trim()) {
      throw new ResourceError("A URL is required for this resource type.", "VALIDATION_ERROR", 400);
    }
    payload.url = url.trim();
  }

  const resource = await Resource.create(payload);
  await resource.populate("author", "displayName avatarUrl");

  // US7 fan-out: notify other current members of this community (FR-022)
  await notificationService.fanOutNewContent({
    communityId,
    authorId: userId,
    type: "new_resource",
    refId: resource._id,
  });

  return toPublicResource(resource);
}

async function getResourceById(resourceId, userId) {
  const resource = await Resource.findOne({ _id: resourceId, status: { $ne: "removed" } }).populate(
    "author",
    "displayName avatarUrl"
  );
  if (!resource) {
    throw new ResourceError("Resource not found.", "NOT_FOUND", 404);
  }

  await assertCommunityReadable(resource.community, userId);

  return toPublicResource(resource);
}

module.exports = {
  ResourceError,
  toPublicResource,
  listResources,
  createResource,
  getResourceById,
};
