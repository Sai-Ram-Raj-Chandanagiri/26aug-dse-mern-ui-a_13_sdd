const express = require("express");

const discussionController = require("../controllers/discussionController");
const authRequired = require("../middleware/authRequired");
const requireCommunityMember = require("../middleware/requireCommunityMember");
const validateBody = require("../middleware/validateBody");

// Mounted at /api so it can own both the community-scoped and the standalone discussion paths
const router = express.Router();

const isNonEmptyString = (max) => (value) => {
  if (typeof value !== "string" || value.trim().length === 0) return "This field is required.";
  if (value.trim().length > max) return `Must be at most ${max} characters.`;
  return true;
};

router.use(authRequired);

router.get("/communities/:communityId/discussions", discussionController.listDiscussions);

router.post(
  "/communities/:communityId/discussions",
  requireCommunityMember("communityId"),
  validateBody({
    title: isNonEmptyString(200),
    body: isNonEmptyString(10000),
  }),
  discussionController.createDiscussion
);

router.get("/discussions/:id", discussionController.getDiscussionById);

// Membership for a comment is tied to the discussion's community, so it is checked in the service
router.post(
  "/discussions/:id/comments",
  validateBody({
    body: isNonEmptyString(2000),
  }),
  discussionController.addComment
);

module.exports = router;
