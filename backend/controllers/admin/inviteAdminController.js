const db = require("../../config/db");
const { ensureInviteTables } = require("../../utils/inviteTables");

const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

const asNullableString = (value) => {
  const str = String(value ?? "").trim();
  return str.length ? str : null;
};

exports.listAllInvites = async (req, res) => {
  try {
    await ensureInviteTables();

    const societyId = asNullableInt(req.query.society_id || req.query.societyId);
    const towerId = asNullableInt(req.query.tower_id || req.query.towerId);
    const unitId = asNullableInt(req.query.unit_id || req.query.unitId);
    const inviteType = asNullableString(req.query.invite_type);
    const status = asNullableString(req.query.status);

    const limitRaw = asNullableInt(req.query.limit) ?? 200;
    const limit = Math.max(1, Math.min(1000, limitRaw));
    const offsetRaw = asNullableInt(req.query.offset) ?? 0;
    const offset = Math.max(0, offsetRaw);

    let sql = "SELECT * FROM pre_approved_invites WHERE 1=1";
    const params = [];

    if (societyId !== null) {
      sql += " AND society_id = ?";
      params.push(societyId);
    }
    if (towerId !== null) {
      sql += " AND tower_id = ?";
      params.push(towerId);
    }
    if (unitId !== null) {
      sql += " AND unit_id = ?";
      params.push(unitId);
    }
    if (inviteType) {
      sql += " AND invite_type = ?";
      params.push(inviteType);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, invites: rows });
  } catch (error) {
    console.error("LIST ALL INVITES ERROR:", error);
    res.status(500).json({ success: false, message: "Unable to fetch invites" });
  }
};

exports.listGateEntryLogs = async (req, res) => {
  try {
    await ensureInviteTables();

    const societyId = asNullableInt(req.query.society_id || req.query.societyId);
    const inviteId = asNullableInt(req.query.invite_id || req.query.inviteId);
    const entryType = asNullableString(req.query.entry_type);
    const entryStatus = asNullableString(req.query.entry_status);

    const limitRaw = asNullableInt(req.query.limit) ?? 200;
    const limit = Math.max(1, Math.min(1000, limitRaw));
    const offsetRaw = asNullableInt(req.query.offset) ?? 0;
    const offset = Math.max(0, offsetRaw);

    let sql = "SELECT * FROM gate_entry_logs WHERE 1=1";
    const params = [];

    if (societyId !== null) {
      sql += " AND society_id = ?";
      params.push(societyId);
    }
    if (inviteId !== null) {
      sql += " AND invite_id = ?";
      params.push(inviteId);
    }
    if (entryType) {
      sql += " AND entry_type = ?";
      params.push(entryType);
    }
    if (entryStatus) {
      sql += " AND entry_status = ?";
      params.push(entryStatus);
    }

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, logs: rows });
  } catch (error) {
    console.error("LIST GATE ENTRY LOGS ERROR:", error);
    res.status(500).json({ success: false, message: "Unable to fetch gate entry logs" });
  }
};

