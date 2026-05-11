const express = require("express");
const { getRecentLogs } = require("../controllers/systemLogController");

const router = express.Router();

router.get("/", getRecentLogs);

module.exports = router;

