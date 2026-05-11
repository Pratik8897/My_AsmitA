const db = require("../config/db");
const { log } = require("./logger");

const TABLE_NAME = "audit_logs";

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return str.length ? str : null;
};

const getDeviceInfoFromRequest = (req) =>
  normalizeText(req?.headers?.["user-agent"]);

const getIpFromRequest = (req) =>
  normalizeText(req?.ip || req?.headers?.["x-forwarded-for"]);

const ensureAuditLogsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(64) NULL,
      user_id INT NULL,
      user_name VARCHAR(150) NULL,
      role VARCHAR(80) NULL,
      module VARCHAR(80) NOT NULL,
      action VARCHAR(120) NOT NULL,
      description TEXT NULL,
      old_value LONGTEXT NULL,
      new_value LONGTEXT NULL,
      ip_address VARCHAR(80) NULL,
      device_info VARCHAR(255) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_created_at (created_at),
      INDEX idx_audit_user_id (user_id),
      INDEX idx_audit_module_action (module, action),
      INDEX idx_audit_status (status)
    )
  `);
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const buildActor = (req, overrides = {}) => {
  const headerUserId = req?.headers?.["x-user-id"] ?? req?.headers?.["x-userid"];
  const headerUserType =
    req?.headers?.["x-user-type"] ?? req?.headers?.["x-usertype"];

  const userId = overrides.user_id ?? overrides.userId ?? headerUserId ?? req?.userId;
  const role = overrides.role ?? overrides.user_type ?? overrides.userType ?? headerUserType ?? req?.userType;

  return {
    user_id: userId != null ? safeNumber(userId) : null,
    user_name: normalizeText(overrides.user_name ?? overrides.userName),
    role: normalizeText(role),
  };
};

async function writeAuditLog({
  req,
  module,
  action,
  description,
  old_value,
  new_value,
  status = "SUCCESS",
  actor = {},
} = {}) {
  const requestId = normalizeText(req?.requestId);
  const { user_id, user_name, role } = buildActor(req, actor);
  const ip_address = getIpFromRequest(req);
  const device_info = getDeviceInfoFromRequest(req);

  const payload = {
    request_id: requestId,
    user_id,
    user_name,
    role,
    module: String(module || "SYSTEM").trim(),
    action: String(action || "UNKNOWN").trim(),
    description: normalizeText(description),
    old_value: normalizeText(old_value),
    new_value: normalizeText(new_value),
    ip_address,
    device_info,
    status: String(status || "SUCCESS").trim(),
  };

  try {
    await ensureAuditLogsTable();
    await db.query(
      `
      INSERT INTO ${TABLE_NAME}
      (request_id, user_id, user_name, role, module, action, description, old_value, new_value, ip_address, device_info, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.request_id,
        payload.user_id,
        payload.user_name,
        payload.role,
        payload.module,
        payload.action,
        payload.description,
        payload.old_value,
        payload.new_value,
        payload.ip_address,
        payload.device_info,
        payload.status,
      ]
    );
  } catch (error) {
    log("warn", "audit_log_fallback", {
      requestId,
      module: payload.module,
      action: payload.action,
      status: payload.status,
      error: error?.message || String(error),
      ...payload,
    });
  }
}

async function cleanupOldAuditLogs(days = 30) {
  const retentionDays = Number(days);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return { deleted: 0 };

  try {
    await ensureAuditLogsTable();
    const [result] = await db.query(
      `DELETE FROM ${TABLE_NAME} WHERE created_at < (NOW() - INTERVAL ? DAY)`,
      [Math.floor(retentionDays)]
    );
    return { deleted: result?.affectedRows ?? 0 };
  } catch {
    return { deleted: 0 };
  }
}

module.exports = {
  ensureAuditLogsTable,
  writeAuditLog,
  cleanupOldAuditLogs,
};

