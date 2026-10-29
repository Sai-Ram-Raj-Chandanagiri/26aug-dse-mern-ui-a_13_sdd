const Community = require("../models/Community");
const Membership = require("../models/Membership");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class CommunityError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function toPublicCommunity(communityDoc) {
  return {
    id: communityDoc._id.toString(),
    name: communityDoc.name,
    description: communityDoc.description,
    visibility: communityDoc.visibility,
    owner: communityDoc.owner.toString(),
    admins: (communityDoc.admins || []).map((id) => id.toString()),
    memberCount: communityDoc.memberCount,
  };
}

// `community` may be a bare ObjectId or a populated doc projected to a subset of fields
// (see `listMyInvitations`), so it gets its own lightweight summary rather than reusing
// `toPublicCommunity` (which assumes the full Community document shape).
function toPublicInvitation(invitationDoc) {
  const community =
    invitationDoc.community && invitationDoc.community.name !== undefined
      ? {
          id: invitationDoc.community._id.toString(),
          name: invitationDoc.community.name,
          description: invitationDoc.community.description,
          visibility: invitationDoc.community.visibility,
        }
      : invitationDoc.community.toString();

  return {
    id: invitationDoc._id.toString(),
    community,
    invitedUser: invitationDoc.invitedUser.toString(),
    invitedBy: invitationDoc.invitedBy.toString(),
    status: invitationDoc.status,
  };
}

// FR-010/FR-011: owner auto-becomes a member (role "owner"), memberCount starts at 1
async function createCommunity(ownerId, { name, description, visibility }) {
  const existing = await Community.findOne({ name });
  if (existing) {
    throw new CommunityError("That community name is already taken.", "NAME_TAKEN", 400);
  }

  const community = await Community.create({
    name,
    description: description || "",
    visibility,
    owner: ownerId,
    admins: [],
    memberCount: 1,
  });

  await Membership.create({ user: ownerId, community: community._id, role: "owner" });

  return toPublicCommunity(community);
}

async function isOwnerOrAdmin(community, userId) {
  const userIdStr = userId.toString();
  if (community.owner.toString() === userIdStr) return true;
  return (community.admins || []).some((adminId) => adminId.toString() === userIdStr);
}

async function updateCommunity(communityId, userId, updates = {}) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new CommunityError("Community not found.", "NOT_FOUND", 404);
  }

  if (!(await isOwnerOrAdmin(community, userId))) {
    throw new CommunityError("Only the owner or an admin can update this community.", "FORBIDDEN", 403);
  }

  if (updates.name !== undefined && updates.name !== community.name) {
    const existing = await Community.findOne({ name: updates.name, _id: { $ne: community._id } });
    if (existing) {
      throw new CommunityError("That community name is already taken.", "NAME_TAKEN", 400);
    }
    community.name = updates.name;
  }

  if (updates.description !== undefined) {
    community.description = updates.description;
  }

  if (updates.visibility !== undefined) {
    community.visibility = updates.visibility;
  }

  await community.save();
  return toPublicCommunity(community);
}

async function getCommunityById(communityId, userId) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new CommunityError("Community not found.", "NOT_FOUND", 404);
  }

  const membership = await Membership.findOne({ user: userId, community: community._id });

  // Private communities never leak existence to non-members (contract: 404, no 403 leak)
  if (community.visibility === "private" && !membership) {
    throw new CommunityError("Community not found.", "NOT_FOUND", 404);
  }

  return { ...toPublicCommunity(community), isMember: Boolean(membership) };
}

// FR-016/FR-025: visibility is enforced inside the Mongoose query (public OR a community the user
// belongs to) — results are never trimmed after fetching (Constitution Principle IV)
async function searchCommunities(userId, query = {}) {
  const { page, pageSize, skip, limit } = getPagination(query);
  const keyword = typeof query.query === "string" ? query.query.trim() : "";

  const memberships = await Membership.find({ user: userId }).select("community");
  const memberCommunityIds = memberships.map((membership) => membership.community);

  const filter = {
    $or: [{ visibility: "public" }, { _id: { $in: memberCommunityIds } }],
  };

  let sort = { name: 1 };
  if (keyword) {
    filter.$text = { $search: keyword };
    sort = { score: { $meta: "textScore" }, name: 1 };
  }

  const baseQuery = Community.find(filter);
  if (keyword) {
    baseQuery.select({ score: { $meta: "textScore" } });
  }

  const [communities, totalItems] = await Promise.all([
    baseQuery.sort(sort).skip(skip).limit(limit),
    Community.countDocuments(filter),
  ]);

  const items = communities.map((community) => ({
    ...toPublicCommunity(community),
    isMember: memberCommunityIds.some((id) => id.toString() === community._id.toString()),
  }));

  return buildPaginatedResult({ items, page, pageSize, totalItems });
}

// FR-014: public communities join immediately; private ones require an accepted invitation
async function joinCommunity(communityId, userId) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new CommunityError("Community not found.", "NOT_FOUND", 404);
  }

  const existingMembership = await Membership.findOne({ user: userId, community: community._id });
  if (existingMembership) {
    throw new CommunityError("You are already a member.", "ALREADY_MEMBER", 400);
  }

  if (community.visibility === "private") {
    throw new CommunityError(
      "This community is private — an invitation is required to join.",
      "PRIVATE_COMMUNITY_INVITE_REQUIRED",
      403
    );
  }

  const membership = await Membership.create({
    user: userId,
    community: community._id,
    role: "member",
  });

  await Community.findByIdAndUpdate(community._id, { $inc: { memberCount: 1 } });

  return {
    id: membership._id.toString(),
    user: membership.user.toString(),
    community: membership.community.toString(),
    role: membership.role,
  };
}

async function isMember(communityId, userId) {
  const membership = await Membership.findOne({ user: userId, community: communityId });
  return Boolean(membership);
}

// FR-012: already-a-member and already-has-a-pending-invitation both reject as ALREADY_MEMBER
async function invite(communityId, inviterId, invitedUserEmail) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new CommunityError("Community not found.", "NOT_FOUND", 404);
  }

  if (!(await isOwnerOrAdmin(community, inviterId))) {
    throw new CommunityError("Only the owner or an admin can invite members.", "FORBIDDEN", 403);
  }

  const normalizedEmail = String(invitedUserEmail || "").trim().toLowerCase();
  const invitedUser = await User.findOne({ email: normalizedEmail });
  if (!invitedUser) {
    throw new CommunityError("No registered user with that email.", "NOT_FOUND", 404);
  }

  const existingMembership = await Membership.findOne({ user: invitedUser._id, community: community._id });
  if (existingMembership) {
    throw new CommunityError("That user is already a member.", "ALREADY_MEMBER", 400);
  }

  const existingInvitation = await Invitation.findOne({
    community: community._id,
    invitedUser: invitedUser._id,
    status: "pending",
  });
  if (existingInvitation) {
    throw new CommunityError("That user already has a pending invitation.", "ALREADY_MEMBER", 400);
  }

  const invitation = await Invitation.create({
    community: community._id,
    invitedUser: invitedUser._id,
    invitedBy: inviterId,
    status: "pending",
  });

  return toPublicInvitation(invitation);
}

async function listMyInvitations(userId) {
  const invitations = await Invitation.find({ invitedUser: userId, status: "pending" })
    .populate("community", "name description visibility")
    .sort({ createdAt: -1 });

  return invitations.map(toPublicInvitation);
}

async function acceptInvitation(invitationId, userId) {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.invitedUser.toString() !== userId.toString()) {
    throw new CommunityError("Invitation not found.", "NOT_FOUND", 404);
  }

  if (invitation.status !== "pending") {
    throw new CommunityError("This invitation is no longer pending.", "INVALID_STATE", 400);
  }

  invitation.status = "accepted";
  await invitation.save();

  const membership = await Membership.create({
    user: userId,
    community: invitation.community,
    role: "member",
  });

  await Community.findByIdAndUpdate(invitation.community, { $inc: { memberCount: 1 } });

  return {
    id: membership._id.toString(),
    user: membership.user.toString(),
    community: membership.community.toString(),
    role: membership.role,
  };
}

async function declineInvitation(invitationId, userId) {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.invitedUser.toString() !== userId.toString()) {
    throw new CommunityError("Invitation not found.", "NOT_FOUND", 404);
  }

  if (invitation.status !== "pending") {
    throw new CommunityError("This invitation is no longer pending.", "INVALID_STATE", 400);
  }

  invitation.status = "declined";
  await invitation.save();

  return null;
}

module.exports = {
  CommunityError,
  toPublicCommunity,
  createCommunity,
  updateCommunity,
  getCommunityById,
  searchCommunities,
  joinCommunity,
  isMember,
  invite,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
};
