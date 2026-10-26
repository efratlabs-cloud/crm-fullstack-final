const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

// @route POST /api/auth/login
router.post("/login", loginUser);

// @route POST /api/auth/google-login
router.post("/google-login", googleLogin);

// @route GET /api/auth/me
router.get("/me", protect, getMe);

// @route POST /api/auth/register
router.post("/register", registerUser);

module.exports = router;
