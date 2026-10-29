const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const { sendSuccess } = require("./utils/responseEnvelope");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const communityRoutes = require("./routes/communityRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const engagementRoutes = require("./routes/engagementRoutes");
const messagingRoutes = require("./routes/messagingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Locally stored avatar/resource uploads (research.md: File Upload Handling — no cloud storage in MVP)
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Health check — route modules are mounted here per bounded context as they are implemented
app.get("/api/health", (req, res) => sendSuccess(res, { data: { status: "ok" } }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/communities", communityRoutes);
// Owns both /api/communities/:communityId/discussions and /api/discussions/*
app.use("/api", discussionRoutes);
// Owns both /api/communities/:communityId/resources and /api/resources/*
app.use("/api", resourceRoutes);
// Owns both /api/reports and /api/admin/reports/*
app.use("/api", reportRoutes);
// Owns /api/notifications*
app.use("/api", notificationRoutes);
// Owns /api/likes and /api/bookmarks
app.use("/api", engagementRoutes);
// Owns /api/conversations*
app.use("/api", messagingRoutes);
app.use("/api/admin", adminRoutes);

// Centralized error handler must be registered last
app.use(errorHandler);

module.exports = app;
