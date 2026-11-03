const express = require("express");
const authController = require("../controllers/authController");
const { ensureAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", ensureAuth, authController.currentUser);

module.exports = router;
