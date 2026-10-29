const express = require("express");

const notificationController = require("../controllers/notificationController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");

// Mounted at /api so it owns /api/notifications* (inbox listing, mark-read, preferences)
const router = express.Router();

const isOptionalBoolean = (value) => value === undefined || typeof value === "boolean" || "Must be a boolean.";

router.use(authRequired);

router.get("/notifications", notificationController.list);
router.get("/notifications/preferences", notificationController.getPreferences);
router.patch(
  "/notifications/preferences",
  validateBody({
    newDiscussion: isOptionalBoolean,
    newResource: isOptionalBoolean,
  }),
  notificationController.updatePreferences
);
router.patch("/notifications/:id/read", notificationController.markRead);

module.exports = router;
