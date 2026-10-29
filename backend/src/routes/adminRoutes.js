const express = require("express");

const adminController = require("../controllers/adminController");
const authRequired = require("../middleware/authRequired");
const requireAdmin = require("../middleware/requireAdmin");
const validateBody = require("../middleware/validateBody");

// Mounted at /api/admin (FR-021: every route here is gated server-side by `requireAdmin`, never UI-only)
const router = express.Router();

const isOptionalString = (value) => value === undefined || typeof value === "string" || "Must be a string.";
const isOptionalVisibility = (value) =>
  value === undefined || ["public", "private"].includes(value) || "Visibility must be 'public' or 'private'.";
const isOptionalRole = (value) => value === undefined || ["user", "admin"].includes(value) || "Role must be 'user' or 'admin'.";
const isObjectIdLike = (value) =>
  (typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)) || "A valid newOwnerId is required.";

router.use(authRequired, requireAdmin);

router.patch(
  "/communities/:id",
  validateBody({
    name: isOptionalString,
    description: isOptionalString,
    visibility: isOptionalVisibility,
  }),
  adminController.updateCommunity
);

router.delete("/communities/:id", adminController.deleteCommunity);

router.post(
  "/communities/:id/transfer-ownership",
  validateBody({ newOwnerId: isObjectIdLike }),
  adminController.transferOwnership
);

router.patch(
  "/users/:id",
  validateBody({
    displayName: isOptionalString,
    bio: isOptionalString,
    role: isOptionalRole,
  }),
  adminController.updateUser
);

router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
