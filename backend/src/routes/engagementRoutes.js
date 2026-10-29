const express = require("express");

const engagementController = require("../controllers/engagementController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");

// Mounted at /api so it owns the engagement endpoints (/api/likes today, bookmarks next)
const router = express.Router();

const TARGET_TYPES = new Set(["discussion", "resource"]);

function validateTargetType(value) {
  if (typeof value !== "string" || !TARGET_TYPES.has(value)) {
    return "Must be one of: discussion, resource.";
  }
  return true;
}

function validateTargetId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    return "A valid targetId is required.";
  }
  return true;
}

const likeBodySchema = {
  targetType: validateTargetType,
  targetId: validateTargetId,
};

router.use(authRequired);

router.post("/likes", validateBody(likeBodySchema), engagementController.like);
// DELETE carries the same polymorphic body as POST (contracts/engagement.md) rather than an id path
router.delete("/likes", validateBody(likeBodySchema), engagementController.unlike);

// Bookmarks use the same polymorphic body as likes to create, but remove by the Bookmark's own id
// (contracts/engagement.md) since a user can have at most one per target anyway
router.post("/bookmarks", validateBody(likeBodySchema), engagementController.createBookmark);
router.delete("/bookmarks/:id", engagementController.removeBookmark);

module.exports = router;
