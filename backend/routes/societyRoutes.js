const express = require("express");
const router = express.Router();

const societyController = require("../controllers/society/societyManagementController");
const towerController = require("../controllers/tower/towerManagementController");
const unitController = require("../controllers/unit/unitManagementController");

/* ---------------- SOCIETY ---------------- */
router.get("/", societyController.getSocieties);
router.post("/", societyController.createSociety);
router.put("/:id", societyController.updateSociety);
router.delete("/:id", societyController.deleteSociety);

/* ---------------- TOWERS ---------------- */
router.post("/towers/bulk", towerController.syncTowers);
router.get("/:id/towers", towerController.getTowersBySociety);
router.delete("/towers/:towerId", towerController.deleteTower);

/* ---------------- UNITS ---------------- */
router.post("/units/generate", unitController.generateUnits);

/* ---------------- CONFIG ---------------- */
router.get("/:id/configs", unitController.getSocietyConfigs);

module.exports = router;
