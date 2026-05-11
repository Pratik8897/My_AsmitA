const express = require("express");
const { listAuditLogs } = require("../controllers/auditLogController");

const router = express.Router();

router.get("/", listAuditLogs);

module.exports = router;

