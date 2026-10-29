const express = require("express");

const reportController = require("../controllers/reportController");
const authRequired = require("../middleware/authRequired");
const requireAdmin = require("../middleware/requireAdmin");
const validateBody = require("../middleware/validateBody");

// Mounted at /api so it can own both /api/reports (any member) and /api/admin/reports/* (admin only)
const router = express.Router();

const TARGET_TYPES = new Set(["discussion", "resource", "comment"]);

function validateTargetType(value) {
  if (typeof value !== "string" || !TARGET_TYPES.has(value)) {
    return "Must be one of: discussion, resource, comment.";
  }
  return true;
}

function validateTargetId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    return "A valid targetId is required.";
  }
  return true;
}

function validateReason(value) {
  if (typeof value !== "string" || value.trim().length === 0) return "This field is required.";
  if (value.trim().length > 500) return "Must be at most 500 characters.";
  return true;
}

router.use(authRequired);

router.post(
  "/reports",
  validateBody({
    targetType: validateTargetType,
    targetId: validateTargetId,
    reason: validateReason,
  }),
  reportController.createReport
);

router.get("/admin/reports", requireAdmin, reportController.listAdminReports);
router.patch("/admin/reports/:id/dismiss", requireAdmin, reportController.dismissReport);
router.patch("/admin/reports/:id/remove-content", requireAdmin, reportController.removeContent);

module.exports = router;
