const express = require("express");

const userController = require("../controllers/userController");
const authRequired = require("../middleware/authRequired");
const validateBody = require("../middleware/validateBody");
const { avatarUpload } = require("../middleware/uploadLimits");

const router = express.Router();

const isOptionalString = (value) => value === undefined || typeof value === "string" || "Must be a string.";

router.use(authRequired);

router.get("/me", userController.getMe);

router.patch(
  "/me",
  validateBody({
    displayName: isOptionalString,
    bio: isOptionalString,
  }),
  userController.updateMe
);

router.post("/me/avatar", avatarUpload.single("avatar"), userController.uploadAvatar);

router.get("/me/activity", userController.getActivity);

router.get("/me/bookmarks", userController.getBookmarks);

module.exports = router;
