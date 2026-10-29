const mongoose = require("mongoose");

const Community = require("../models/Community");
const Membership = require("../models/Membership");
const Invitation = require("../models/Invitation");
const Discussion = require("../models/Discussion");
const Comment = require("../models/Comment");
const Resource = require("../models/Resource");
const User = require("../models/User");
const { toPublicCommunity } = require("./communityService");
const { toPublicUser } = require("./userService");

class AdminError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const COMMUNITY_EDITABLE_FIELDS = ["name", "description", "visibility"];
// FR-020: email is never admin-editable; role is the only other field an admin may change beyond
// what a user can edit about themselves.
const USER_EDITABLE_FIELDS = ["displayName", "bio", "role"];

// Future user-story models (Like, Bookmark, Report) register themselves with mongoose as those
// features ship; lookups are guarded so earlier user stories don't need to know about them yet.
function getModelIfRegistered(name) {
  return mongoose.models[name] || null;
}

// Admins bypass the owner/admin check `communityService.updateCommunity` enforces for self-service edits
async function updateCommunity(communityId, updates = {}) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new AdminError("Community not found.", "NOT_FOUND", 404);
  }

  if (updates.name !== undefined && updates.name !== community.name) {
    const existing = await Community.findOne({ name: updates.name, _id: { $ne: community._id } });
    if (existing) {
      throw new AdminError("That community name is already taken.", "NAME_TAKEN", 400);
    }
  }

  for (const field of COMMUNITY_EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      community[field] = updates[field];
    }
  }

  await community.save();
  return toPublicCommunity(community);
}

// FR-019: blocked if any non-resolved (i.e. "active") Discussion exists unless `force` is set;
// cascades to every model scoped to the community inside a single transaction so a mid-cascade
// failure leaves no partial deletion (data-model.md "Community" deletion rule).
async function deleteCommunity(communityId, { force = false } = {}) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new AdminError("Community not found.", "NOT_FOUND", 404);
  }

  const unresolvedCount = await Discussion.countDocuments({ community: communityId, status: "active" });
  if (unresolvedCount > 0 && !force) {
    throw new AdminError(
      "This community has unresolved discussions. Pass force=true to override.",
      "UNRESOLVED_DISCUSSIONS",
      409
    );
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const discussionIds = await Discussion.find({ community: communityId }, { _id: 1 }).session(session);
      const discussionIdList = discussionIds.map((doc) => doc._id);

      if (discussionIdList.length > 0) {
        await Comment.deleteMany({ discussion: { $in: discussionIdList } }).session(session);
      }

      await Discussion.deleteMany({ community: communityId }).session(session);
      await Resource.deleteMany({ community: communityId }).session(session);
      await Membership.deleteMany({ community: communityId }).session(session);
      await Invitation.deleteMany({ community: communityId }).session(session);

      const Like = getModelIfRegistered("Like");
      if (Like) {
        await Like.deleteMany({
          $or: [
            { targetType: "discussion", targetId: { $in: discussionIdList } },
            { community: communityId },
          ],
        }).session(session);
      }

      const Bookmark = getModelIfRegistered("Bookmark");
      if (Bookmark) {
        await Bookmark.deleteMany({ community: communityId }).session(session);
      }

      const Report = getModelIfRegistered("Report");
      if (Report) {
        await Report.deleteMany({ community: communityId }).session(session);
      }

      await Community.deleteOne({ _id: communityId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  return null;
}

// FR-020: email is stripped unconditionally, matching `userService.updateMe`'s guarantee that it
// is never settable past registration, even by an admin
async function updateUser(userId, updates = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AdminError("User not found.", "NOT_FOUND", 404);
  }

  for (const field of USER_EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      user[field] = updates[field];
    }
  }

  await user.save();
  return toPublicUser(user);
}

// FR-019: blocked (409) while the user owns any community, until `transferOwnership` moves
// ownership elsewhere; cascades the user's authored content in a single transaction.
async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AdminError("User not found.", "NOT_FOUND", 404);
  }

  const ownedCommunityCount = await Community.countDocuments({ owner: userId });
  if (ownedCommunityCount > 0) {
    throw new AdminError(
      "This user owns one or more communities. Transfer ownership before deleting.",
      "OWNERSHIP_TRANSFER_REQUIRED",
      409
    );
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const authoredDiscussionIds = (
        await Discussion.find({ author: userId }, { _id: 1 }).session(session)
      ).map((doc) => doc._id);

      if (authoredDiscussionIds.length > 0) {
        await Comment.deleteMany({ discussion: { $in: authoredDiscussionIds } }).session(session);
      }

      await Discussion.deleteMany({ author: userId }).session(session);
      await Comment.deleteMany({ author: userId }).session(session);
      await Resource.deleteMany({ author: userId }).session(session);
      await Membership.deleteMany({ user: userId }).session(session);
      await Invitation.deleteMany({ $or: [{ invitedUser: userId }, { invitedBy: userId }] }).session(session);
      await Community.updateMany({ admins: userId }, { $pull: { admins: userId } }).session(session);

      const Like = getModelIfRegistered("Like");
      if (Like) {
        await Like.deleteMany({ user: userId }).session(session);
      }

      const Bookmark = getModelIfRegistered("Bookmark");
      if (Bookmark) {
        await Bookmark.deleteMany({ user: userId }).session(session);
      }

      const Report = getModelIfRegistered("Report");
      if (Report) {
        await Report.deleteMany({ reporter: userId }).session(session);
      }

      const Notification = getModelIfRegistered("Notification");
      if (Notification) {
        await Notification.deleteMany({ user: userId }).session(session);
      }

      const NotificationPreference = getModelIfRegistered("NotificationPreference");
      if (NotificationPreference) {
        await NotificationPreference.deleteMany({ user: userId }).session(session);
      }

      await User.deleteOne({ _id: userId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  return null;
}

// Resolves the OWNERSHIP_TRANSFER_REQUIRED gate: the new owner must already be a member, the
// outgoing owner's membership is demoted to admin (not removed), and the new owner's membership
// is promoted to "owner".
async function transferOwnership(communityId, newOwnerId) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new AdminError("Community not found.", "NOT_FOUND", 404);
  }

  const newOwnerMembership = await Membership.findOne({ user: newOwnerId, community: communityId });
  if (!newOwnerMembership) {
    throw new AdminError("The new owner must already be a member of this community.", "NOT_A_MEMBER", 400);
  }

  const previousOwnerId = community.owner;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      community.owner = newOwnerId;
      community.admins = (community.admins || []).filter((id) => id.toString() !== newOwnerId.toString());
      await community.save({ session });

      newOwnerMembership.role = "owner";
      await newOwnerMembership.save({ session });

      if (previousOwnerId && previousOwnerId.toString() !== newOwnerId.toString()) {
        await Membership.updateOne(
          { user: previousOwnerId, community: communityId },
          { $set: { role: "admin" } }
        ).session(session);
      }
    });
  } finally {
    await session.endSession();
  }

  return toPublicCommunity(community);
}

module.exports = {
  AdminError,
  updateCommunity,
  deleteCommunity,
  updateUser,
  deleteUser,
  transferOwnership,
};
