const express = require("express");
const router = express.Router();

const visitorController = require("../controllers/visitor/visitorController");

// Visitor types
router.get("/visitor-types", visitorController.getVisitorTypes);

// Visitor entries
router.get("/visitor-entries/resolve-resident", visitorController.resolveResidentForUnit);
router.post("/visitor-entries", visitorController.createVisitorEntry);
router.get("/visitor-entries/:id", visitorController.getVisitorEntryById);

// Guard views
router.get("/guard/visitor-entries", visitorController.listGuardVisitorEntries);
router.patch("/visitor-entries/:id/check-in", visitorController.checkInVisitorEntry);
router.patch("/visitor-entries/:id/check-out", visitorController.checkOutVisitorEntry);

// Resident views
router.get(
  "/resident/visitor-requests",
  visitorController.listResidentVisitorRequests
);
router.patch("/visitor-entries/:id/approve", visitorController.approveVisitorEntry);
router.patch("/visitor-entries/:id/reject", visitorController.rejectVisitorEntry);

module.exports = router;
