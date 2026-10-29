const { sendError } = require("../utils/responseEnvelope");

// Generic request-body validator (Constitution Principle III — server-side validation is source of truth)
// `schema` is a map of fieldName -> (value) => true | "error message"
function validateBody(schema) {
  return function (req, res, next) {
    const errors = {};
    for (const [field, validator] of Object.entries(schema)) {
      const result = validator(req.body?.[field], req.body);
      if (result !== true) {
        errors[field] = result;
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, {
        message: "Validation failed.",
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    }

    return next();
  };
}

module.exports = validateBody;
