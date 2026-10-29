const multer = require("multer");

// Multer size-limited upload middleware (research.md: File Upload Handling — avatar 5MB / resource file 10MB)
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const RESOURCE_FILE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function imageOnlyFileFilter(req, file, cb) {
  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
    const err = new Error("Only image uploads (PNG, JPEG, WEBP, GIF) are allowed.");
    err.code = "INVALID_FILE_TYPE";
    return cb(err);
  }
  return cb(null, true);
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: imageOnlyFileFilter,
});

const resourceFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESOURCE_FILE_MAX_BYTES },
});

module.exports = { AVATAR_MAX_BYTES, RESOURCE_FILE_MAX_BYTES, avatarUpload, resourceFileUpload };
