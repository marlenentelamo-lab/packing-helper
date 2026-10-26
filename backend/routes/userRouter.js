const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");
const { ensureAuth } = require("../middleware/authMiddleware");

router.put("/profile", ensureAuth, userController.updateProfile);

module.exports = router;