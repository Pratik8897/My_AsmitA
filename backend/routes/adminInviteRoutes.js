const express = require("express");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/admin/inviteAdminController");

const router = express.Router();

router.get("/pre-approved-invites", requireRole(["admin", "super-admin"]), controller.listAllInvites);
router.get("/gate-entry-logs", requireRole(["admin", "super-admin"]), controller.listGateEntryLogs);

module.exports = router;

