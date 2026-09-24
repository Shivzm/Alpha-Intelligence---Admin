const express = require("express");
const { getAdminData } = require("../controllers/adminController");
const { requireAuth } = require("../controllers/authController");

const router = express.Router();

router.get("/data", requireAuth, getAdminData);

module.exports = router;