// routes/importRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { importUnits } = require("../controllers/unit/importController");

router.post("/import-units", upload.single("file"), importUnits);

module.exports = router;