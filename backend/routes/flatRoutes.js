const express = require("express");
const router = express.Router();
const flatsController = require("../controllers/flatsController");

// Assigned flats in a society (for dropdown filtering)
router.get("/assigned", flatsController.getAssignedFlatIdsBySociety);

// Generate flats
router.post("/generate", flatsController.generateFlats);

// Get flats by society
router.get("/society/:societyId", flatsController.getFlatsBySociety);

router.get("/:flatId", flatsController.getFlatById);

module.exports = router;
