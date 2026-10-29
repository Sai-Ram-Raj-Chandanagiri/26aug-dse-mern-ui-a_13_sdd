const express = require("express");

const resourceController = require("../controllers/resourceController");
const authRequired = require("../middleware/authRequired");
const requireCommunityMember = require("../middleware/requireCommunityMember");
const validateBody = require("../middleware/validateBody");
const { resourceFileUpload } = require("../middleware/uploadLimits");

// Mounted at /api so it can own both the community-scoped and the standalone resource paths
const router = express.Router();

const RESOURCE_TYPES = new Set(["article", "video", "link", "file"]);

function validateType(value) {
  if (typeof value !== "string" || !RESOURCE_TYPES.has(value)) {
    return "Must be one of: article, video, link, file.";
  }
  return true;
}

function validateTitle(value) {
  if (typeof value !== "string" || value.trim().length === 0) return "This field is required.";
  if (value.trim().length > 200) return "Must be at most 200 characters.";
  return true;
}

// `url` is only required for the link/article/video variants; the `file` variant is validated in
// the service against `req.file` set by multer
function validateUrl(value, body) {
  if (body?.type === "file") return true;
  if (typeof value !== "string" || value.trim().length === 0) return "This field is required.";
  return true;
}

router.use(authRequired);

router.get("/communities/:communityId/resources", resourceController.listResources);

router.post(
  "/communities/:communityId/resources",
  requireCommunityMember("communityId"),
  // Multer only parses multipart/form-data bodies; JSON requests pass through untouched
  resourceFileUpload.single("file"),
  validateBody({
    type: validateType,
    title: validateTitle,
    url: validateUrl,
  }),
  resourceController.createResource
);

router.get("/resources/:id", resourceController.getResourceById);

module.exports = router;
