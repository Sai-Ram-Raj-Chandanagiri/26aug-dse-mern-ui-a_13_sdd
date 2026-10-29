const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const Membership = require("../models/Membership");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class NotificationError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Maps a fan-out `type` to the matching NotificationPreference boolean field
const CATEGORY_BY_TYPE = {
  new_discussion: "newDiscussion",
  new_resource: "newResource",
};

function toPublicNotification(notificationDoc) {
  return {
    id: notificationDoc._id.toString(),
    community: notificationDoc.community.toString(),
    type: notificationDoc.type,
    refId: notificationDoc.refId.toString(),
    readAt: notificationDoc.readAt,
    createdAt: notificationDoc.createdAt,
  };
}

function toPublicPreference(preferenceDoc) {
  return {
    id: preferenceDoc._id.toString(),
    newDiscussion: preferenceDoc.newDiscussion,
    newResource: preferenceDoc.newResource,
  };
}

// FR-022: paginated inbox listing, newest first
async function listNotifications(userId, query = {}) {
  const { page, pageSize, skip, limit } = getPagination(query);
  const filter = { user: userId };

  const [notifications, totalItems] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return buildPaginatedResult({
    items: notifications.map(toPublicNotification),
    page,
    pageSize,
    totalItems,
  });
}

async function markRead(userId, notificationId) {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) {
    throw new NotificationError("Notification not found.", "NOT_FOUND", 404);
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return toPublicNotification(notification);
}

// Upserts so a user who has never touched their preferences still gets the schema defaults
// (all categories enabled) back from a single round-trip
async function getPreferences(userId) {
  const preference = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true }
  );
  return toPublicPreference(preference);
}

// FR-023: only the fields provided are changed; all categories may end up `false`
async function updatePreferences(userId, { newDiscussion, newResource } = {}) {
  const update = {};
  if (typeof newDiscussion === "boolean") update.newDiscussion = newDiscussion;
  if (typeof newResource === "boolean") update.newResource = newResource;

  const preference = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    { $set: update, $setOnInsert: { user: userId } },
    { upsert: true, new: true }
  );
  return toPublicPreference(preference);
}

// Fan-out-on-write (FR-022): notifies every current community member except the author, skipping
// anyone who disabled this category. Membership is queried at call time, so a member who has
// already left the community by the time the content is created is naturally excluded.
async function fanOutNewContent({ communityId, authorId, type, refId }) {
  const category = CATEGORY_BY_TYPE[type];
  if (!category) {
    throw new NotificationError("Invalid notification type.", "VALIDATION_ERROR", 400);
  }

  const memberships = await Membership.find({ community: communityId, user: { $ne: authorId } }, "user");
  if (memberships.length === 0) {
    return;
  }
  const memberIds = memberships.map((membership) => membership.user);

  const preferences = await NotificationPreference.find({ user: { $in: memberIds } }, `user ${category}`);
  const disabledUserIds = new Set(
    preferences.filter((preference) => preference[category] === false).map((preference) => preference.user.toString())
  );

  const recipientIds = memberIds.filter((userId) => !disabledUserIds.has(userId.toString()));
  if (recipientIds.length === 0) {
    return;
  }

  await Notification.insertMany(
    recipientIds.map((user) => ({ user, community: communityId, type, refId }))
  );
}

module.exports = {
  NotificationError,
  toPublicNotification,
  toPublicPreference,
  listNotifications,
  markRead,
  getPreferences,
  updatePreferences,
  fanOutNewContent,
};
