const express = require("express");
const rateLimit = require("express-rate-limit");
const { AI_ACTIONS, ai } = require("../services/nlpService");

const router = express.Router();
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.use(aiRateLimit);
router.get("/actions", (request, response) => {
  return response.json({ data: { actions: AI_ACTIONS }, meta: { requestId: request.requestId } });
});

router.post("/:action", async (request, response, next) => {
  try {
    const data = await ai(request.params.action, request.body);
    return response.json({ data, meta: { requestId: request.requestId } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
