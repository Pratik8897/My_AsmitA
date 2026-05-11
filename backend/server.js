require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { cleanupOldLogFiles } = require("./utils/logger");
const { cleanupOldAuditLogs } = require("./utils/auditLogger");

const app = express();

// DB Connection
require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const societyRoutes = require("./routes/societyRoutes");
const flatRoutes = require("./routes/flatRoutes");
const societyAdminRoutes = require("./routes/societyAdminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const unitRoutes = require("./routes/unitRoutes");
const importRoutes = require("./routes/importRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const preApprovedInviteRoutes = require("./routes/preApprovedInviteRoutes");
const gateInviteRoutes = require("./routes/gateInviteRoutes");
const adminInviteRoutes = require("./routes/adminInviteRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health Check
app.get("/", (req, res) => {
  res.send("API Running");
});

// ✅ Users API
app.use("/api/users", userRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/units", unitRoutes);
app.use("/api", importRoutes);
app.use("/api", visitorRoutes);
app.use("/api/pre-approved-invites", preApprovedInviteRoutes);
app.use("/api/gate", gateInviteRoutes);
app.use("/api/admin", adminInviteRoutes);
app.use("/api/society-admins", societyAdminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

// ❗ TEMP: Comment auth until ready
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/system-logs", require("./routes/systemLogRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));

app.use(errorHandler);

// Log retention cleanup (default 30 days)
(async () => {
  const retentionDays = Number(process.env.LOG_RETENTION_DAYS || 30);
  await cleanupOldLogFiles(retentionDays);
  await cleanupOldAuditLogs(retentionDays);
  setInterval(() => {
    void cleanupOldLogFiles(retentionDays);
    void cleanupOldAuditLogs(retentionDays);
  }, 24 * 60 * 60 * 1000);
})();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
