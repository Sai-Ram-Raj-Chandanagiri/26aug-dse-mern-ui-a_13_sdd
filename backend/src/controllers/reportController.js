const reportService = require("../services/reportService");
const { sendSuccess, sendError } = require("../utils/responseEnvelope");

function handleReportError(res, err, next) {
  if (err instanceof reportService.ReportError) {
    return sendError(res, { message: err.message, code: err.code, statusCode: err.statusCode });
  }
  return next(err);
}

async function createReport(req, res, next) {
  try {
    const report = await reportService.createReport(req.user.id, req.body);
    return sendSuccess(res, { data: { report }, message: "Report submitted.", statusCode: 201 });
  } catch (err) {
    return handleReportError(res, err, next);
  }
}

async function listAdminReports(req, res, next) {
  try {
    const result = await reportService.listAdminReports(req.query);
    return sendSuccess(res, { data: result, message: "" });
  } catch (err) {
    return handleReportError(res, err, next);
  }
}

async function dismissReport(req, res, next) {
  try {
    const report = await reportService.dismissReport(req.params.id);
    return sendSuccess(res, { data: { report }, message: "Report dismissed." });
  } catch (err) {
    return handleReportError(res, err, next);
  }
}

async function removeContent(req, res, next) {
  try {
    const report = await reportService.removeContent(req.params.id);
    return sendSuccess(res, { data: { report }, message: "Content removed." });
  } catch (err) {
    return handleReportError(res, err, next);
  }
}

module.exports = {
  createReport,
  listAdminReports,
  dismissReport,
  removeContent,
};
