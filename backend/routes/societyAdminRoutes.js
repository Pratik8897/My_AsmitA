const express = require("express");
const router = express.Router();

const {
  getSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
} = require("../controllers/societyAdminController");

router.get("/", getSocieties);
router.post("/", createSociety);
router.put("/:id", updateSociety);
router.delete("/:id", deleteSociety);

module.exports = router;