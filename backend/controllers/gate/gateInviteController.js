const db = require("../../config/db");
const { ensureInviteTables } = require("../../utils/inviteTables");
const { validateInviteForEntry, maskPrivateInvite, normalizePhone } = require("../../utils/inviteValidation");
const { writeAuditLog } = require("../../utils/auditLogger");

const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const getGuardUserId = (req) =>
  req.userId ||
  asNullableInt(req.headers["x-user-id"] || req.headers["x-userid"]) ||
  asNullableInt(req.body?.guard_id) ||
  null;

const findInviteByCodeOrMobile = async ({ mobile, pass_code, qr_code }) => {
  if (pass_code) {
    const [guestRows] = await db.query(
      "SELECT * FROM pre_approved_invite_guests WHERE pass_code = ? LIMIT 1",
      [String(pass_code).trim()]
    );
    if (guestRows[0]) {
      const guest = guestRows[0];
      const [inviteRows] = await db.query(
        "SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1",
        [guest.invite_id]
      );
      return { invite: inviteRows[0] || null, guest };
    }

    const [inviteRows] = await db.query(
      "SELECT * FROM pre_approved_invites WHERE pass_code = ? LIMIT 1",
      [String(pass_code).trim()]
    );
    return { invite: inviteRows[0] || null, guest: null };
  }

  if (qr_code) {
    const [guestRows] = await db.query(
      "SELECT * FROM pre_approved_invite_guests WHERE qr_code = ? LIMIT 1",
      [String(qr_code).trim()]
    );
    if (guestRows[0]) {
      const guest = guestRows[0];
      const [inviteRows] = await db.query(
        "SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1",
        [guest.invite_id]
      );
      return { invite: inviteRows[0] || null, guest };
    }

    const [inviteRows] = await db.query(
      "SELECT * FROM pre_approved_invites WHERE qr_code = ? LIMIT 1",
      [String(qr_code).trim()]
    );
    return { invite: inviteRows[0] || null, guest: null };
  }

  if (mobile) {
    const normalized = normalizePhone(mobile);
    const [guestRows] = await db.query(
      "SELECT * FROM pre_approved_invite_guests WHERE mobile_number = ? ORDER BY id DESC LIMIT 1",
      [normalized]
    );
    if (guestRows[0]) {
      const guest = guestRows[0];
      const [inviteRows] = await db.query(
        "SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1",
        [guest.invite_id]
      );
      return { invite: inviteRows[0] || null, guest };
    }

    const [inviteRows] = await db.query(
      "SELECT * FROM pre_approved_invites WHERE mobile_number = ? ORDER BY id DESC LIMIT 1",
      [normalized]
    );
    return { invite: inviteRows[0] || null, guest: null };
  }

  return { invite: null, guest: null };
};

exports.searchInvite = async (req, res) => {
  try {
    await ensureInviteTables();
    const societyId = asNullableInt(req.query.society_id || req.headers["x-society-id"]);
    const mobile = req.query.mobile;
    const pass_code = req.query.pass_code;
    const qr_code = req.query.qr_code;

    void writeAuditLog({
      req,
      module: "GATE",
      action: "INVITE_SEARCHED",
      description: "QR/pass searched",
      status: "SUCCESS",
      new_value: { mobile: mobile || null, pass_code: pass_code ? "***" : null, qr_code: qr_code ? "***" : null },
    });

    const { invite, guest } = await findInviteByCodeOrMobile({ mobile, pass_code, qr_code });
    if (!invite) {
      void writeAuditLog({
        req,
        module: "GATE",
        action: "INVALID_QR_PASS_SCAN",
        description: "Invalid QR/pass scan",
        status: "FAILED",
        new_value: { mobile: mobile || null },
      });
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    if (societyId && Number(invite.society_id) !== Number(societyId)) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    const role = req.userType || req.headers["x-user-type"];
    const maskedInvite = maskPrivateInvite(invite, role);

    const validation = await validateInviteForEntry({
      invite,
      guest,
      pass_code: pass_code || null,
      qr_code: qr_code || null,
    });

    if (!validation.ok) {
      const action =
        validation.reason === "Daily limit reached"
          ? "DAILY_LIMIT_REACHED"
          : validation.reason === "Invite expired"
            ? "EXPIRED_INVITE_USED"
            : "ENTRY_DENIED";

      void writeAuditLog({
        req,
        module: "GATE",
        action,
        description: validation.reason,
        status: "FAILED",
        new_value: { invite_id: invite.id, invite_guest_id: guest?.id || null },
      });
    }

    return res.json({
      success: true,
      invite: maskedInvite,
      guest,
      valid: validation.ok,
      reason: validation.ok ? null : validation.reason,
    });
  } catch (error) {
    console.error("SEARCH INVITE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to search invite" });
  }
};

async function insertGateLog({
  society_id,
  gate_id,
  invite,
  guest,
  entry_status,
  denial_reason,
  checked_in_by_guard_id,
  checked_out_by_guard_id,
  checked_in_at,
  checked_out_at,
}) {
  await db.query(
    `
    INSERT INTO gate_entry_logs
    (society_id, gate_id, invite_id, invite_guest_id, visitor_name, mobile_number, vehicle_number,
     entry_type, entry_status, denial_reason, checked_in_by_guard_id, checked_out_by_guard_id,
     checked_in_at, checked_out_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      society_id,
      gate_id,
      invite?.id || null,
      guest?.id || null,
      guest?.guest_name || invite?.visitor_name || null,
      guest?.mobile_number || invite?.mobile_number || null,
      guest?.vehicle_number || invite?.vehicle_number || null,
      invite?.invite_type || "guest",
      entry_status,
      denial_reason || null,
      checked_in_by_guard_id || null,
      checked_out_by_guard_id || null,
      checked_in_at || null,
      checked_out_at || null,
    ]
  );
}

exports.checkIn = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const guardId = getGuardUserId(req);
    const gateId = asNullableInt(req.body?.gate_id);
    const societyId = asNullableInt(req.body?.society_id || req.headers["x-society-id"]) || 1;
    const guestId = asNullableInt(req.body?.invite_guest_id);

    const [inviteRows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const invite = inviteRows[0];
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (societyId && Number(invite.society_id) !== Number(societyId)) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    const guest = guestId
      ? (await db.query("SELECT * FROM pre_approved_invite_guests WHERE id = ? AND invite_id = ? LIMIT 1", [guestId, id]))[0][0] || null
      : null;

    const validation = await validateInviteForEntry({
      invite,
      guest,
      pass_code: req.body?.pass_code || null,
      qr_code: req.body?.qr_code || null,
    });

    if (!validation.ok) {
      await insertGateLog({
        society_id: societyId,
        gate_id: gateId,
        invite,
        guest,
        entry_status: "denied",
        denial_reason: validation.reason,
        checked_in_by_guard_id: guardId,
        checked_in_at: new Date(),
      });
      void writeAuditLog({
        req,
        module: "GATE",
        action: "ENTRY_DENIED",
        description: "Entry denied",
        status: "FAILED",
        new_value: { invite_id: id, invite_guest_id: guestId, reason: validation.reason },
      });
      return res.status(400).json({ success: false, message: validation.reason });
    }

    if (guest) {
      await db.query(
        "UPDATE pre_approved_invite_guests SET status = 'checked_in', checked_in_at = NOW() WHERE id = ?",
        [guest.id]
      );
    }

    const onceLike = ["quick", "once", "private"].includes(String(invite.invite_sub_type || "").toLowerCase());
    if (onceLike) {
      await db.query("UPDATE pre_approved_invites SET status = 'used' WHERE id = ?", [id]);
    }

    await insertGateLog({
      society_id: societyId,
      gate_id: gateId,
      invite,
      guest,
      entry_status: "checked_in",
      checked_in_by_guard_id: guardId,
      checked_in_at: new Date(),
    });

    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKED_IN",
      description: "Visitor checked in",
      status: "SUCCESS",
      new_value: { invite_id: id, invite_guest_id: guestId, gate_id: gateId },
    });

    return res.json({ success: true, message: "Checked in" });
  } catch (error) {
    console.error("CHECKIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to check-in" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const guardId = getGuardUserId(req);
    const gateId = asNullableInt(req.body?.gate_id);
    const societyId = asNullableInt(req.body?.society_id || req.headers["x-society-id"]) || 1;
    const guestId = asNullableInt(req.body?.invite_guest_id);

    const [inviteRows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const invite = inviteRows[0];
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (societyId && Number(invite.society_id) !== Number(societyId)) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    const guest = guestId
      ? (await db.query("SELECT * FROM pre_approved_invite_guests WHERE id = ? AND invite_id = ? LIMIT 1", [guestId, id]))[0][0] || null
      : null;

    if (guest) {
      await db.query(
        "UPDATE pre_approved_invite_guests SET status = 'checked_out', checked_out_at = NOW() WHERE id = ?",
        [guest.id]
      );
    }

    await insertGateLog({
      society_id: societyId,
      gate_id: gateId,
      invite,
      guest,
      entry_status: "checked_out",
      checked_out_by_guard_id: guardId,
      checked_out_at: new Date(),
    });

    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKED_OUT",
      description: "Visitor checked out",
      status: "SUCCESS",
      new_value: { invite_id: id, invite_guest_id: guestId, gate_id: gateId },
    });

    return res.json({ success: true, message: "Checked out" });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to check-out" });
  }
};

exports.deny = async (req, res) => {
  try {
    await ensureInviteTables();
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invite id" });

    const guardId = getGuardUserId(req);
    const gateId = asNullableInt(req.body?.gate_id);
    const societyId = asNullableInt(req.body?.society_id || req.headers["x-society-id"]) || 1;
    const guestId = asNullableInt(req.body?.invite_guest_id);
    const reason = String(req.body?.denial_reason || "Denied").trim();

    const [inviteRows] = await db.query("SELECT * FROM pre_approved_invites WHERE id = ? LIMIT 1", [id]);
    const invite = inviteRows[0];
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (societyId && Number(invite.society_id) !== Number(societyId)) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    const guest = guestId
      ? (await db.query("SELECT * FROM pre_approved_invite_guests WHERE id = ? AND invite_id = ? LIMIT 1", [guestId, id]))[0][0] || null
      : null;

    await insertGateLog({
      society_id: societyId,
      gate_id: gateId,
      invite,
      guest,
      entry_status: "denied",
      denial_reason: reason,
      checked_in_by_guard_id: guardId,
      checked_in_at: new Date(),
    });

    void writeAuditLog({
      req,
      module: "GATE",
      action: "ENTRY_DENIED",
      description: "Entry denied",
      status: "SUCCESS",
      new_value: { invite_id: id, invite_guest_id: guestId, gate_id: gateId, reason },
    });

    return res.json({ success: true, message: "Denied" });
  } catch (error) {
    console.error("DENY ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to deny" });
  }
};
