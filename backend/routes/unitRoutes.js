const express = require("express");
const router = express.Router();

const unitMergeController = require("../controllers/unit/unitMergeController");

router.post("/merge", unitMergeController.mergeUnits);
router.post("/unmerge", unitMergeController.unmergeUnits);

module.exports = router;

