const express = require("express");
const router = express.Router();
const flatsController = require("../controllers/flatsController");

// Assigned flats
router.get("/assigned", flatsController.getAssignedFlatIdsBySociety);

// Generate flats
router.post("/generate", flatsController.generateFlats);

// Get flats
router.get("/society/:societyId", flatsController.getFlatsBySociety);
router.get("/:flatId", flatsController.getFlatById);

// ✅ FIXED (no extra /flats)
router.post("/update-structure", flatsController.updateFlatStructure);

// Bulk update types
router.put("/unit-types/bulk", flatsController.bulkUpdateUnitTypes);

module.exports = router;