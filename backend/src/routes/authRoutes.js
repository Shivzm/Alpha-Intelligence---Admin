const express = require("express");
const {
  getCurrentUser,
  login,
  loginWithGoogle,
  logout,
  requestPasswordReset,
  requireAuth,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/google", loginWithGoogle);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", logout);
router.post("/forgot-password", requestPasswordReset);

module.exports = router;