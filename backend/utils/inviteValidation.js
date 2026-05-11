const db = require("../config/db");
const { normalizeRoleKey } = require("./roleUtils");

const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const normalizePhone = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);

const parseAllowedDays = (raw) => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const dayKey = (date = new Date()) =>
  ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];

const isWithinDateRange = ({ valid_from, valid_to }, now = new Date()) => {
  if (!valid_from && !valid_to) return true;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (valid_from) {
    const vf = new Date(valid_from);
    const from = new Date(vf.getFullYear(), vf.getMonth(), vf.getDate());
    if (today < from) return false;
  }
  if (valid_to) {
    const vt = new Date(valid_to);
    const to = new Date(vt.getFullYear(), vt.getMonth(), vt.getDate());
    if (today > to) return false;
  }
  return true;
};

const isWithinTimeRange = ({ start_time, end_time }, now = new Date()) => {
  if (!start_time && !end_time) return true;
  const toMinutes = (t) => {
    if (!t) return null;
    const parts = String(t).split(":");
    const hh = Number(parts[0] || 0);
    const mm = Number(parts[1] || 0);
    return hh * 60 + mm;
  };
  const start = toMinutes(start_time);
  const end = toMinutes(end_time);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start != null && current < start) return false;
  if (end != null && current > end) return false;
  return true;
};

async function countEntriesToday({ inviteId }) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM gate_entry_logs
    WHERE invite_id = ?
      AND entry_status IN ('checked_in','allowed')
      AND DATE(created_at) = CURDATE()
    `,
    [inviteId]
  );
  return Number(rows?.[0]?.total || 0);
}

async function countGuestsCheckedInToday({ inviteId }) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM pre_approved_invite_guests
    WHERE invite_id = ?
      AND status IN ('checked_in','checked_out')
      AND DATE(created_at) = CURDATE()
    `,
    [inviteId]
  );
  return Number(rows?.[0]?.total || 0);
}

function maskPrivateInvite(invite, role) {
  const normalizedRole = normalizeRoleKey(role);
  const canSee = ["super-admin", "admin"].includes(normalizedRole);
  if (Number(invite?.is_private) !== 1 || canSee) return invite;

  return {
    ...invite,
    visitor_name: invite.visitor_name ? "Private Visitor" : invite.visitor_name,
    mobile_number: invite.mobile_number ? "**********" : invite.mobile_number,
    vehicle_number: invite.vehicle_number ? "****" : invite.vehicle_number,
    purpose: invite.purpose ? "Private" : invite.purpose,
  };
}

async function validateInviteForEntry({ invite, guest, pass_code, qr_code }) {
  if (!invite) return { ok: false, reason: "Invite not found" };

  const status = String(invite.status || "").toLowerCase();
  if (status !== "active") {
    return { ok: false, reason: `Invite is ${status}` };
  }

  const now = new Date();
  if (!isWithinDateRange(invite, now)) return { ok: false, reason: "Invite expired" };
  if (!isWithinTimeRange(invite, now)) return { ok: false, reason: "Outside allowed time" };

  const allowedDays = parseAllowedDays(invite.allowed_days);
  if (Array.isArray(allowedDays) && allowedDays.length > 0) {
    const todayKey = dayKey(now);
    if (!allowedDays.map((d) => String(d).toLowerCase()).includes(todayKey)) {
      return { ok: false, reason: "Not allowed today" };
    }
  }

  const inviteId = asNullableInt(invite.id);
  if (inviteId && invite.entries_per_day) {
    const used = await countEntriesToday({ inviteId });
    if (used >= Number(invite.entries_per_day)) {
      return { ok: false, reason: "Daily limit reached" };
    }
  }

  if (invite.invite_sub_type === "group" && invite.max_guest_count) {
    const used = await countGuestsCheckedInToday({ inviteId });
    if (used >= Number(invite.max_guest_count)) {
      return { ok: false, reason: "Max guest count reached" };
    }
  }

  // Code validation
  if (pass_code) {
    const code = String(pass_code).trim();
    const expected = guest ? guest.pass_code : invite.pass_code;
    if (!expected || String(expected).trim() !== code) {
      return { ok: false, reason: "Invalid pass code" };
    }
  }
  if (qr_code) {
    const code = String(qr_code).trim();
    const expected = guest ? guest.qr_code : invite.qr_code;
    if (!expected || String(expected).trim() !== code) {
      return { ok: false, reason: "Invalid QR code" };
    }
  }

  return { ok: true };
}

module.exports = {
  normalizePhone,
  validateInviteForEntry,
  maskPrivateInvite,
};

