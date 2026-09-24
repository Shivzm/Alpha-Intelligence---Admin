const express = require("express");
const {
  login,
  requestPasswordReset,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);

module.exports = router;