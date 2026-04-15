const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// Debug (important)
console.log("Controller:", userController);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.get("/stats", userController.getUserStats);

module.exports = router;