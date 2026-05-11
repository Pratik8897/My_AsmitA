const db = require("../config/db");
const { ensureAuditLogsTable } = require("../utils/auditLogger");

const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

const asNullableString = (value) => {
  const str = String(value ?? "").trim();
  return str.length ? str : null;
};

exports.listAuditLogs = async (req, res) => {
  try {
    await ensureAuditLogsTable();

    const userId = asNullableInt(req.query.user_id || req.query.userId);
    const module = asNullableString(req.query.module);
    const action = asNullableString(req.query.action);
    const status = asNullableString(req.query.status);
    const from = asNullableString(req.query.from);
    const to = asNullableString(req.query.to);

    const limitRaw = asNullableInt(req.query.limit) ?? 200;
    const limit = Math.max(1, Math.min(1000, limitRaw));

    const offsetRaw = asNullableInt(req.query.offset) ?? 0;
    const offset = Math.max(0, offsetRaw);

    let sql = `
      SELECT id, request_id, user_id, user_name, role, module, action, description,
             old_value, new_value, ip_address, device_info, status, created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (userId !== null) {
      sql += " AND user_id = ?";
      params.push(userId);
    }
    if (module) {
      sql += " AND module = ?";
      params.push(module);
    }
    if (action) {
      sql += " AND action = ?";
      params.push(action);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (from) {
      sql += " AND created_at >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND created_at <= ?";
      params.push(to);
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, logs: rows });
  } catch (error) {
    console.error("LIST AUDIT LOGS ERROR:", error);
    res.status(500).json({ success: false, message: "Unable to fetch audit logs" });
  }
};

