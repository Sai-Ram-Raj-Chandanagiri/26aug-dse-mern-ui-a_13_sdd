const { sendError } = require("../utils/responseEnvelope");
const env = require("../config/env");

// Centralized error handler — maps errors to the uniform envelope, never exposes raw stack traces (Principle III)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return sendError(res, {
      message: "Upload exceeds the maximum allowed file size.",
      code: "OVERSIZED_UPLOAD",
      statusCode: 413,
    });
  }

  if (err?.code === "INVALID_FILE_TYPE") {
    return sendError(res, {
      message: err.message,
      code: "INVALID_FILE_TYPE",
      statusCode: 400,
    });
  }

  if (err?.name === "ValidationError") {
    return sendError(res, { message: err.message, code: "VALIDATION_ERROR", statusCode: 400 });
  }

  if (err?.code === 11000) {
    return sendError(res, { message: "Duplicate value violates a uniqueness rule.", code: "DUPLICATE", statusCode: 409 });
  }

  if (env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return sendError(res, {
    message: "An unexpected error occurred.",
    code: "INTERNAL_ERROR",
    statusCode: err?.statusCode || 500,
  });
}

module.exports = errorHandler;
