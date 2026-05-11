const crypto = require("crypto");
const { log } = require("../utils/logger");

function makeRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function requestLogger(req, res, next) {
  const requestId = makeRequestId();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const headerUserId = req.headers["x-user-id"] ?? req.headers["x-userid"];
  const headerUserType =
    req.headers["x-user-type"] ?? req.headers["x-usertype"];

  if (headerUserId != null) req.userId = Number(headerUserId);
  if (headerUserType) req.userType = String(headerUserType);

  const startNs = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    log("info", "http_request", {
      requestId,
      userId: req.userId,
      userType: req.userType,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
}

module.exports = requestLogger;
