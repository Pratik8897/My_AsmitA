const { log } = require("../utils/logger");

function errorHandler(err, req, res, next) {
  const requestId = req.requestId;

  log("error", "unhandled_error", {
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
  });

  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    requestId,
  });
}

module.exports = errorHandler;

