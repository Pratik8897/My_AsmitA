const express = require("express");
const router = express.Router();

const societyAdminController = require("../controllers/societyAdminController");

router.get("/", societyAdminController.getSocietyAdmins);
router.post("/", societyAdminController.createSocietyAdmin);
router.put("/:id", societyAdminController.updateSocietyAdmin);
router.delete("/:id", societyAdminController.deleteSocietyAdmin);

module.exports = router;
