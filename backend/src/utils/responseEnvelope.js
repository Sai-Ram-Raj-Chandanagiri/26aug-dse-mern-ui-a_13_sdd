// Uniform response envelope: { success, data, message } (Constitution Principle V)
function sendSuccess(res, { data = null, message = "OK", statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, data, message });
}

function sendError(res, { message = "An error occurred", code = "ERROR", statusCode = 400 } = {}) {
  return res.status(statusCode).json({ success: false, data: null, message, code });
}

module.exports = { sendSuccess, sendError };
