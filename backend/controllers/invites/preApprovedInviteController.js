const db = require("../../config/db");
const { ensureInviteTables } = require("../../utils/inviteTables");
const { generatePassCode, generateQrCodeToken } = require("../../utils/inviteCode");
const { normalizePhone } = require("../../utils/inviteValidation");
const { writeAuditLog } = require("../../utils/auditLogger");

const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const toNullable = (value) => (isBlank(value) ? null : value);

const normalizeInviteType = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return ["guest", "cab", "delivery"].includes(v) ? v : null;
};

const normalizeInviteSubType = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return ["quick", "group", "frequent", "private", "once"].includes(v) ? v : null;
};

const normalizeStatus = (value) => {
  const v = String(value || "").trim().toLowerCase();
  return ["draft", "active", "used", "expired", "cancelled", "blocked"].includes(v) ? v : "active";
};

const getActorUserId = (req) =>
  req.userId ||
  asNullableInt(req.headers["x-user-id"] || req.headers["x-userid"]) ||
  asNullableInt(req.body?.resident_id) ||
  null;

exports.createInvite = async (req, res) => {
  try {
    await ensureInviteTables();

    const residentId = getActorUserId(req);
    if (!residentId) return res.status(400).json({ success: false, message: "resident_id required" });

    const societyId = asNullableInt(req.body?.society_id);
    const towerId = asNullableInt(req.body?.tower_id);
    const unitId = asNullableInt(req.body?.unit_id);
    if (!societyId) return res.status(400).json({ success: false, message: "society_id required" });
    if (!towerId) return res.status(400).json({ success: false, message: "tower_id required" });
    if (!unitId) return res.status(400).json({ success: false, message: "unit_id required" });

    const inviteType = normalizeInviteType(req.body?.invite_type);
    const inviteSubType = normalizeInviteSubType(req.body?.invite_sub_type);
    if (!inviteType) return res.status(400).json({ success: false, message: "invite_type invalid" });
    if (!inviteSubType) return res.status(400).json({ success: false, message: "invite_sub_type invalid" });

    const status = normalizeStatus(req.body?.status);

    const title = toNullable(req.body?.title);
    const visitorName = toNullable(req.body?.visitor_name);
    const mobileNumber = toNullable(req.body?.mobile_number)
      ? normalizePhone(req.body?.mobile_number)
      : null;
    const companyName = toNullable(req.body?.company_name);
    const vehicleNumber = toNullable(req.body?.vehicle_number);
    const purpose = toNullable(req.body?.purpose);

    const validFrom = toNullable(req.body?.valid_from);
    const validTo = toNullable(req.body?.valid_to);
    const startTime = toNullable(req.body?.start_time);
    const endTime = toNullable(req.body?.end_time);

    const allowedDays = Array.isArray(req.body?.allowed_days)
      ? JSON.stringify(req.body.allowed_days)
      : toNullable(req.body?.allowed_days);

    const entriesPerDay = req.body?.entries_per_day != null ? Number(req.body.entries_per_day) : null;
    const maxGuestCount = req.body?.max_guest_count != null ? Number(req.body.max_guest_count) : null;

    const isPrivate = Boolean(req.body?.is_private) || inviteSubType === "private";
    const approvalRequired = Boolean(req.body?.approval_required);

    const passCode = req.body?.pass_code ? String(req.body.pass_code).trim() : generatePassCode();
    const qrCode = req.body?.qr_code ? String(req.body.qr_code).trim() : generateQrCodeToken();

    const createdBy = asNullableInt(req.body?.created_by) || residentId;

    const [result] = await db.query(
      `
      INSERT INTO pre_approved_invites
      (society_id, tower_id, unit_id, resident_id, invite_type, invite_sub_type, title, visitor_name, mobile_number,
       company_name, vehicle_number, purpose, valid_from, valid_to, start_time, end_time, allowed_days,
       entries_per_day, max_guest_count, qr_code, pass_code, is_private, approval_required, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        societyId,
        towerId,
        unitId,
        residentId,
        inviteType,
        inviteSubType,
        title,
        visitorName,
        mobileNumber,
        companyName,
        vehicleNumber,
        purpose,
        validFrom,
        validTo,
        startTime,
        endTime,
        allowedDays,
        Number.isFinite(entriesPerDay) ? entriesPerDay : null,
        Number.isFinite(maxGuestCount) ? maxGuestCount : null,
        qrCode,
        passCode,
        isPrivate ? 1 : 0,
        approvalRequired ? 1 : 0,
        status,
        createdBy,
      ]
    );

    const inviteId = result.insertId;

    const guests = Array.isArray(req.body?.guests) ? req.body.guests : [];
    if (inviteSubType === "group" && guests.length > 0) {
      const values = guests.map((g) => [
        inviteId,
        toNullable(g?.guest_name),
        g?.mobile_number ? normalizePhone(g.mobile_number) : null,
        toNullable(g?.vehicle_number),
        g?.qr_code ? String(g.qr_code).trim() : generateQrCodeToken(),
        g?.pass_code ? String(g.pass_code).trim() : generatePassCode(),
        "pending",
      ]);

      await db.query(
        `
        INSERT INTO pre_approved_invite_guests
        (invite_id, guest_name, mobile_number, vehicle_number, qr_code, pass_code, status)
        VALUES ?
        `,
        [values]
      );
    }

    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_CREATED",
      description: "Pre-approved invite created",
      status: "SUCCESS",
      new_value: { id: inviteId, ...req.body, pass_code: passCode, qr_code: qrCode },
    });

    const [rows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [inviteId]);
    return res.status(201).json({ success: true, invite: rows[0] });
  } catch (error) {
    console.error("CREATE INVITE ERROR:", error);
    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_CREATED",
      description: "Pre-approved invite create failed",
      status: "ERROR",
      new_value: req.body,
    });
    return res.status(500).json({ success: false, message: "Unable to create invite" });
  }
};

exports.listMyInvites = async (req, res) => {
  try {
    await ensureInviteTables();
    const residentId = getActorUserId(req);
    if (!residentId) return res.status(400).json({ success: false, message: "resident_id required" });

    const [rows] = await db.query(
      `SELECT *
       FROM pre_approved_invites
       WHERE resident_id = ?
       ORDER BY id DESC`,
      [residentId]
    );
    return res.json({ success: true, invites: rows });
  } catch (error) {
    console.error("LIST MY INVITES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load invites" });
  }
};

exports.getInviteById = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const [rows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const invite = rows[0];
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    const residentId = getActorUserId(req);
    const role = String(req.userType || req.headers["x-user-type"] || "");
    const normalizedRole = role.trim().toLowerCase();
    const canAdmin = normalizedRole.includes("admin");
    if (!canAdmin && residentId && Number(invite.resident_id) !== Number(residentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const guests =
      invite.invite_sub_type === "group"
        ? (await db.query("SELECT * FROM pre_approved_invite_guests WHERE invite_id = ? ORDER BY id ASC", [id]))[0]
        : [];

    return res.json({ success: true, invite, guests });
  } catch (error) {
    console.error("GET INVITE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load invite" });
  }
};

exports.updateInvite = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const residentId = getActorUserId(req);
    if (!residentId) return res.status(400).json({ success: false, message: "resident_id required" });

    const [oldRows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const oldInvite = oldRows[0];
    if (!oldInvite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (Number(oldInvite.resident_id) !== Number(residentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (["cancelled", "blocked"].includes(String(oldInvite.status || "").toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invite cannot be modified" });
    }

    const nextStatus = req.body?.status ? normalizeStatus(req.body.status) : oldInvite.status;

    await db.query(
      `
      UPDATE pre_approved_invites
      SET title = ?, visitor_name = ?, mobile_number = ?, company_name = ?, vehicle_number = ?, purpose = ?,
          valid_from = ?, valid_to = ?, start_time = ?, end_time = ?, allowed_days = ?, entries_per_day = ?, max_guest_count = ?,
          is_private = ?, approval_required = ?, status = ?
      WHERE id = ?
      `,
      [
        toNullable(req.body?.title),
        toNullable(req.body?.visitor_name),
        toNullable(req.body?.mobile_number) ? normalizePhone(req.body.mobile_number) : null,
        toNullable(req.body?.company_name),
        toNullable(req.body?.vehicle_number),
        toNullable(req.body?.purpose),
        toNullable(req.body?.valid_from),
        toNullable(req.body?.valid_to),
        toNullable(req.body?.start_time),
        toNullable(req.body?.end_time),
        Array.isArray(req.body?.allowed_days) ? JSON.stringify(req.body.allowed_days) : toNullable(req.body?.allowed_days),
        req.body?.entries_per_day != null ? Number(req.body.entries_per_day) : null,
        req.body?.max_guest_count != null ? Number(req.body.max_guest_count) : null,
        req.body?.is_private != null ? (Boolean(req.body.is_private) ? 1 : 0) : Number(oldInvite.is_private),
        req.body?.approval_required != null ? (Boolean(req.body.approval_required) ? 1 : 0) : Number(oldInvite.approval_required),
        nextStatus,
        id,
      ]
    );

    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_UPDATED",
      description: "Invite updated",
      status: "SUCCESS",
      old_value: oldInvite,
      new_value: { id, ...req.body, status: nextStatus },
    });

    const [rows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    return res.json({ success: true, invite: rows[0] });
  } catch (error) {
    console.error("UPDATE INVITE ERROR:", error);
    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_UPDATED",
      description: "Invite update failed",
      status: "ERROR",
      new_value: { id: req.params.id, ...req.body },
    });
    return res.status(500).json({ success: false, message: "Unable to update invite" });
  }
};

exports.cancelInvite = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const residentId = getActorUserId(req);
    if (!residentId) return res.status(400).json({ success: false, message: "resident_id required" });

    const [oldRows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const oldInvite = oldRows[0];
    if (!oldInvite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (Number(oldInvite.resident_id) !== Number(residentId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    await db.query("UPDATE pre_approved_invites SET status = 'cancelled' WHERE id = ?", [id]);

    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_CANCELLED",
      description: "Invite cancelled",
      status: "SUCCESS",
      old_value: oldInvite,
      new_value: { id, status: "cancelled" },
    });

    return res.json({ success: true, message: "Invite cancelled" });
  } catch (error) {
    console.error("CANCEL INVITE ERROR:", error);
    void writeAuditLog({
      req,
      module: "INVITE",
      action: "INVITE_CANCELLED",
      description: "Invite cancel failed",
      status: "ERROR",
      new_value: { id: req.params.id },
    });
    return res.status(500).json({ success: false, message: "Unable to cancel invite" });
  }
};

