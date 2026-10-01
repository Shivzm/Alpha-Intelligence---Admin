const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  getPublicStats,
  listPublicInternships,
  submitEnquiry,
  verifyCertificate,
} = require("../controllers/publicController");

const router = express.Router();
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.get("/internships", listPublicInternships);
router.get("/stats", getPublicStats);
router.post("/enquiries", enquiryLimiter, submitEnquiry);
router.get("/certificates/verify/:code", verifyCertificate);

module.exports = router;
