function apiErrorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  const statusCode = error.statusCode || (error.message === "Origin is not allowed by CORS." ? 403 : 500);
  const code = error.code || (statusCode === 403 ? "ORIGIN_NOT_ALLOWED" : "INTERNAL_ERROR");
  const message = statusCode < 500 || statusCode === 503
    ? error.message
    : "The request could not be completed.";

  if (statusCode >= 500 && statusCode !== 503) {
    console.error("Unhandled API error:", error);
  }

  return response.status(statusCode).json({
    error: {
      code,
      message,
      details: null,
      requestId: request.requestId || null,
    },
  });
}

module.exports = { apiErrorHandler };
