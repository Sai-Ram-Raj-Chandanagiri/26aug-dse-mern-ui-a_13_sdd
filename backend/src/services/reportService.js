const Report = require("../models/Report");
const Discussion = require("../models/Discussion");
const Resource = require("../models/Resource");
const Comment = require("../models/Comment");
const { getPagination, buildPaginatedResult } = require("../utils/pagination");

class ReportError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Polymorphic target resolution — targetType picks the collection a Report's targetId belongs to
const TARGET_MODELS = {
  discussion: Discussion,
  resource: Resource,
  comment: Comment,
};

function toPublicReport(reportDoc) {
  return {
    id: reportDoc._id.toString(),
    reporter: reportDoc.reporter.toString(),
    targetType: reportDoc.targetType,
    targetId: reportDoc.targetId.toString(),
    reason: reportDoc.reason,
    status: reportDoc.status,
    hiddenForReporter: reportDoc.hiddenForReporter,
    createdAt: reportDoc.createdAt,
  };
}

async function findTarget(targetType, targetId) {
  const Model = TARGET_MODELS[targetType];
  if (!Model) {
    throw new ReportError("Invalid target type.", "VALIDATION_ERROR", 400);
  }
  const target = await Model.findById(targetId);
  if (!target) {
    throw new ReportError("Reported content not found.", "NOT_FOUND", 404);
  }
  return { Model, target };
}

// FR-028: self-report and duplicate-report rejection happen here, ahead of the unique-index write
async function createReport(reporterId, { targetType, targetId, reason }) {
  const { target } = await findTarget(targetType, targetId);

  if (target.author.toString() === reporterId.toString()) {
    throw new ReportError("You cannot report your own content.", "SELF_REPORT", 400);
  }

  const existing = await Report.findOne({ reporter: reporterId, targetType, targetId });
  if (existing) {
    throw new ReportError("You have already reported this content.", "DUPLICATE_REPORT", 400);
  }

  let report;
  try {
    report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      reason: reason.trim(),
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new ReportError("You have already reported this content.", "DUPLICATE_REPORT", 400);
    }
    throw err;
  }

  return toPublicReport(report);
}

// FR-029: admin moderation dashboard, paginated and optionally filtered by status
async function listAdminReports(query = {}) {
  const { page, pageSize, skip, limit } = getPagination(query);
  const status = typeof query.status === "string" ? query.status.trim() : "";

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const [reports, totalItems] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("reporter", "displayName avatarUrl"),
    Report.countDocuments(filter),
  ]);

  return buildPaginatedResult({
    items: reports.map((reportDoc) => ({
      ...toPublicReport(reportDoc),
      reporter:
        reportDoc.reporter && reportDoc.reporter.displayName !== undefined
          ? {
              id: reportDoc.reporter._id.toString(),
              displayName: reportDoc.reporter.displayName,
              avatarUrl: reportDoc.reporter.avatarUrl || null,
            }
          : reportDoc.reporter.toString(),
    })),
    page,
    pageSize,
    totalItems,
  });
}

// Dismissal restores visibility for the reporter: clearing `hiddenForReporter` means per-reporter
// hiding queries (which only exclude `hiddenForReporter: true` reports) stop excluding the content
// (FR-029); `status` moves to `dismissed` purely for the admin dashboard's own lifecycle.
async function dismissReport(reportId) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ReportError("Report not found.", "NOT_FOUND", 404);
  }

  report.status = "dismissed";
  report.hiddenForReporter = false;
  await report.save();

  return toPublicReport(report);
}

// Removal hides the content for everyone by setting the target's own `status = 'removed'`, which
// every listing query already excludes (Constitution Principle VI — explicit action, not a global
// flag on the Report itself).
async function removeContent(reportId) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ReportError("Report not found.", "NOT_FOUND", 404);
  }

  const { target } = await findTarget(report.targetType, report.targetId);
  target.status = "removed";
  await target.save();

  report.status = "removed";
  await report.save();

  return toPublicReport(report);
}

module.exports = {
  ReportError,
  toPublicReport,
  createReport,
  listAdminReports,
  dismissReport,
  removeContent,
};
