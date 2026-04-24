const express = require("express");
const router = express.Router();

const {
  getSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
  createTowers,
  generateUnits,
  getTowersBySociety,
  getTowerConfigs,

} = require("../controllers/societyController");

/* ---------------- SOCIETY ---------------- */

router.get("/", getSocieties);
router.post("/", createSociety);
router.put("/:id", updateSociety);
router.delete("/:id", deleteSociety);

/* ---------------- TOWERS ---------------- */

router.post("/towers/bulk", createTowers);
router.get("/:id/towers", getTowersBySociety);

/* ---------------- UNITS ---------------- */

router.post("/units/generate", generateUnits);

router.get("/:id/configs", getTowerConfigs);

module.exports = router;