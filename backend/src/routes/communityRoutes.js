const express = require("express");

const communityController = require("../controllers/communityController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");

const router = express.Router();

const isNonEmptyString = (value) => (typeof value === "string" && value.trim().length > 0) || "This field is required.";
const isOptionalString = (value) => value === undefined || typeof value === "string" || "Must be a string.";
const isVisibility = (value) => ["public", "private"].includes(value) || "Visibility must be 'public' or 'private'.";
const isOptionalVisibility = (value) =>
  value === undefined || ["public", "private"].includes(value) || "Visibility must be 'public' or 'private'.";
const isEmail = (value) =>
  (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) || "A valid email is required.";

router.use(authRequired);

router.get("/", communityController.searchCommunities);

router.post(
  "/",
  validateBody({
    name: isNonEmptyString,
    description: isOptionalString,
    visibility: isVisibility,
  }),
  communityController.createCommunity
);

// Specific paths must be registered before the "/:id" catch-all below
router.get("/invitations/mine", communityController.listMyInvitations);
router.post("/invitations/:invitationId/accept", communityController.acceptInvitation);
router.post("/invitations/:invitationId/decline", communityController.declineInvitation);

router.get("/:id", communityController.getCommunityById);

router.patch(
  "/:id",
  validateBody({
    name: isOptionalString,
    description: isOptionalString,
    visibility: isOptionalVisibility,
  }),
  communityController.updateCommunity
);

router.post(
  "/:id/invitations",
  validateBody({
    invitedUserEmail: isEmail,
  }),
  communityController.invite
);

router.post("/:id/join", communityController.joinCommunity);

module.exports = router;
