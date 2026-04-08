const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@test.com" && password === "123456") {
    return res.json({ success: true, token: "dummy_token" });
  }

  res.status(401).json({ success: false, message: "Invalid credentials" });
});

module.exports = router;