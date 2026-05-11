const express = require("express");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/invites/preApprovedInviteController");

const router = express.Router();

// Resident (and admins)
router.post("/", requireRole(["user", "owner", "tenant", "resident", "society-admin", "admin", "super-admin"]), controller.createInvite);
router.get("/my", requireRole(["user", "owner", "tenant", "resident", "society-admin", "admin", "super-admin"]), controller.listMyInvites);
router.get("/:id", requireRole(["user", "owner", "tenant", "resident", "society-admin", "admin", "super-admin"]), controller.getInviteById);
router.put("/:id", requireRole(["user", "owner", "tenant", "resident", "society-admin", "admin", "super-admin"]), controller.updateInvite);
router.patch("/:id/cancel", requireRole(["user", "owner", "tenant", "resident", "society-admin", "admin", "super-admin"]), controller.cancelInvite);

module.exports = router;

