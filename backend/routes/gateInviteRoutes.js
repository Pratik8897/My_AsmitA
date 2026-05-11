const express = require("express");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/gate/gateInviteController");

const router = express.Router();

router.get("/pre-approved-invites/search", requireRole(["security-guard", "admin", "super-admin", "society-admin", "society-manager"]), controller.searchInvite);
router.post("/pre-approved-invites/:id/check-in", requireRole(["security-guard", "admin", "super-admin", "society-admin", "society-manager"]), controller.checkIn);
router.post("/pre-approved-invites/:id/check-out", requireRole(["security-guard", "admin", "super-admin", "society-admin", "society-manager"]), controller.checkOut);
router.post("/pre-approved-invites/:id/deny", requireRole(["security-guard", "admin", "super-admin", "society-admin", "society-manager"]), controller.deny);

module.exports = router;

