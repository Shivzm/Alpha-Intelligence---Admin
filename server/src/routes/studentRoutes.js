const express = require("express");
const rateLimit = require("express-rate-limit");
const { ApiError } = require("../services/firestoreRepository");
const { requireStudentAuth } = require("../middleware/requireStudentAuth");
const {
  getStudentProfile,
  listStudentApplications,
  listStudentCertificates,
  listStudentNotifications,
  listStudentStipends,
  saveStudentProfile,
  submitStudentApplication,
} = require("../controllers/studentController");

const router = express.Router();
const studentApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(request, response, next) {
    next(new ApiError(429, "STUDENT_RATE_LIMITED", "Too many student API requests. Try again later."));
  },
});
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(request, response, next) {
    next(new ApiError(429, "APPLICATION_RATE_LIMITED", "Too many applications were submitted. Try again later."));
  },
});

router.use(studentApiLimiter, requireStudentAuth);
router.get("/profile", getStudentProfile);
router.put("/profile", saveStudentProfile);
router.get("/applications", listStudentApplications);
router.post("/applications", applicationLimiter, submitStudentApplication);
router.get("/stipends", listStudentStipends);
router.get("/certificates", listStudentCertificates);
router.get("/notifications", listStudentNotifications);

module.exports = router;
