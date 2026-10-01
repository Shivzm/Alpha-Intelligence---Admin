const express = require("express");
const { firebaseUserCreated, firebaseUserDeleted, ingestEvent, runBackup, runCleanup } = require("../controllers/internalController");
const { requireInternalSecret } = require("../middleware/requireInternalSecret");

const router = express.Router();
router.use(requireInternalSecret);
router.post("/events", ingestEvent);
router.post("/firebase/user-created", firebaseUserCreated);
router.post("/firebase/user-deleted", firebaseUserDeleted);
router.post("/jobs/backup-run", runBackup);
router.post("/jobs/cleanup", runCleanup);

module.exports = router;
