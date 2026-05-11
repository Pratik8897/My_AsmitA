const db = require("../../config/db");
const { writeAuditLog } = require("../../utils/auditLogger");

const VISITOR_ENTRY_STATUSES = new Set([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CHECKED_IN",
  "CHECKED_OUT",
]);

const normalizeTrimmed = (value) => String(value ?? "").trim();
const asNullableInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizePhone = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);

const getSocietyIdFromRequest = (req) => {
  const fromHeader = asNullableInt(req.headers["x-society-id"]);
  const fromQuery = asNullableInt(req.query.society_id || req.query.societyId);
  const fromBody = asNullableInt(req.body?.society_id || req.body?.societyId);
  return fromHeader || fromQuery || fromBody || 1; // TEMP fallback
};

const getActorUserIdFromRequest = (req, fallback = null) => {
  const fromHeader = asNullableInt(req.headers["x-user-id"]);
  const fromQuery = asNullableInt(req.query.user_id || req.query.userId);
  const fromBody = asNullableInt(req.body?.user_id || req.body?.userId);
  return fromHeader || fromQuery || fromBody || fallback;
};

const resolveResidentForFlat = async (flatId) => {
  if (!flatId) return null;

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_flat_mapping (
      mapping_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      flat_id INT NOT NULL,
      ownership_type ENUM('Owner','Tenant') NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_flat (user_id, flat_id),
      INDEX idx_ufm_user (user_id),
      INDEX idx_ufm_flat (flat_id)
    )
  `);

  const [rows] = await db.query(
    `
    SELECT u.user_id, u.full_name
    FROM user_flat_mapping ufm
    JOIN users u ON u.user_id = ufm.user_id
    WHERE ufm.flat_id = ?
    ORDER BY (ufm.ownership_type = 'Owner') DESC, ufm.mapping_id ASC
    LIMIT 1
    `,
    [flatId]
  );

  return rows[0] || null;
};

exports.resolveResidentForUnit = async (req, res) => {
  try {
    const unitId = asNullableInt(req.query.unit_id || req.query.unitId);
    if (!unitId) return res.status(400).json({ error: "unit_id is required" });

    const resolved = await resolveResidentForFlat(unitId);
    return res.json({
      unit_id: unitId,
      resident_user_id: resolved?.user_id || null,
      resident_name: resolved?.full_name || null,
    });
  } catch (error) {
    console.error("RESOLVE RESIDENT ERROR:", error);
    return res.status(500).json({ error: "Unable to resolve resident" });
  }
};

const canResidentActOnEntry = async ({ userId, flatId, residentUserId }) => {
  if (!userId || !flatId) return false;
  if (residentUserId && Number(residentUserId) === Number(userId)) return true;

  const [rows] = await db.query(
    `SELECT 1
     FROM user_flat_mapping
     WHERE user_id = ? AND flat_id = ?
     LIMIT 1`,
    [userId, flatId]
  );

  return rows.length > 0;
};

const fetchVisitorEntryWithJoins = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      ve.*,
      vt.name AS visitor_type_name,
      t.tower_name,
      f.flat_number AS unit_number,
      ru.full_name AS resident_name,
      gu.full_name AS requested_by_guard_name,
      au.full_name AS approved_by_name
    FROM visitor_entries ve
    LEFT JOIN visitor_types vt ON vt.id = ve.visitor_type_id
    LEFT JOIN towers t ON t.tower_id = ve.tower_id
    LEFT JOIN flats f ON f.flat_id = ve.unit_id
    LEFT JOIN users ru ON ru.user_id = ve.resident_user_id
    LEFT JOIN users gu ON gu.user_id = ve.requested_by_guard_id
    LEFT JOIN users au ON au.user_id = ve.approved_by_user_id
    WHERE ve.id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

exports.getVisitorTypes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, status, created_at, updated_at
       FROM visitor_types
       WHERE COALESCE(status, 'active') <> 'inactive'
       ORDER BY name ASC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("GET VISITOR TYPES ERROR:", error);
    return res.status(500).json({ error: "Unable to load visitor types" });
  }
};

exports.createVisitorEntry = async (req, res) => {
  try {
    const societyId = getSocietyIdFromRequest(req);

    const towerId = asNullableInt(req.body?.tower_id);
    const unitId = asNullableInt(req.body?.unit_id);
    const visitorTypeId = asNullableInt(req.body?.visitor_type_id);

    const visitorName = normalizeTrimmed(req.body?.visitor_name);
    const visitorPhone = normalizePhone(req.body?.visitor_phone);
    const purpose = normalizeTrimmed(req.body?.purpose) || null;
    const vehicleNumber = normalizeTrimmed(req.body?.vehicle_number) || null;
    const remarks = normalizeTrimmed(req.body?.remarks) || null;

    const noOfVisitorsRaw = Number(req.body?.no_of_visitors ?? 1);
    const noOfVisitors =
      Number.isFinite(noOfVisitorsRaw) && noOfVisitorsRaw > 0
        ? Math.floor(noOfVisitorsRaw)
        : 1;

    const requestedByGuardId = getActorUserIdFromRequest(req, 1); // TEMP fallback

    if (!societyId) {
      return res.status(400).json({ error: "society_id is required" });
    }
    if (!towerId) {
      return res.status(400).json({ error: "tower_id is required" });
    }
    if (!unitId) {
      return res.status(400).json({ error: "unit_id is required" });
    }
    if (!visitorName) {
      return res.status(400).json({ error: "visitor_name is required" });
    }
    if (visitorPhone.length !== 10) {
      return res.status(400).json({ error: "visitor_phone must be 10 digits" });
    }

    // Validate flat and prevent creating requests against merged member flats
    const [flatRows] = await db.query(
      `SELECT flat_id, flat_number, unit_type, is_merged
       FROM flats
       WHERE flat_id = ?
       LIMIT 1`,
      [unitId]
    );

    if (flatRows.length === 0) {
      return res.status(400).json({ error: "Invalid unit_id" });
    }

    const flat = flatRows[0];
    const flatNumber = String(flat.flat_number || "");
    const unitType = String(flat.unit_type || "");
    const isMerged = Number(flat.is_merged) === 1;

    // Allow creating requests for merged flat rows like "101+102" (unit_type=Jodi),
    // but block member flats that are part of a merge.
    if (unitType.toUpperCase() === "MERGED" || flatNumber.startsWith("M-")) {
      return res.status(400).json({ error: "Invalid unit selected" });
    }

    if (isMerged && !flatNumber.includes("+")) {
      return res.status(400).json({
        error: "Please select the merged unit (e.g. 101+102) instead of a member flat",
      });
    }

    const residentFromBody = asNullableInt(req.body?.resident_user_id);
    const resolvedResident = await resolveResidentForFlat(unitId);
    const residentUserId = resolvedResident?.user_id || residentFromBody || null;

    const [result] = await db.query(
      `
      INSERT INTO visitor_entries
      (society_id, tower_id, unit_id, resident_user_id, visitor_name, visitor_phone, visitor_type_id,
       purpose, vehicle_number, no_of_visitors, status, requested_by_guard_id, requested_at, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), ?)
      `,
      [
        societyId,
        towerId,
        unitId,
        residentUserId,
        visitorName,
        visitorPhone,
        visitorTypeId,
        purpose,
        vehicleNumber,
        noOfVisitors,
        requestedByGuardId,
        remarks,
      ]
    );

    const entry = await fetchVisitorEntryWithJoins(result.insertId);

    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_ENTRY_CREATED",
      description: "Visitor entry created",
      status: "SUCCESS",
      new_value: {
        id: result.insertId,
        society_id: societyId,
        tower_id: towerId,
        unit_id: unitId,
        resident_user_id: residentUserId,
        visitor_name: visitorName,
        visitor_phone: visitorPhone,
        status: "PENDING",
        requested_by_guard_id: requestedByGuardId,
      },
    });

    return res.status(201).json(entry);
  } catch (error) {
    console.error("CREATE VISITOR ENTRY ERROR:", error);
    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_ENTRY_CREATED",
      description: "Visitor entry create failed",
      status: "ERROR",
      new_value: req.body,
    });
    return res.status(500).json({ error: "Unable to create visitor request" });
  }
};

exports.listGuardVisitorEntries = async (req, res) => {
  try {
    const societyId = getSocietyIdFromRequest(req);

    const [rows] = await db.query(
      `
      SELECT
        ve.*,
        vt.name AS visitor_type_name,
        t.tower_name,
        f.flat_number AS unit_number,
        ru.full_name AS resident_name
      FROM visitor_entries ve
      LEFT JOIN visitor_types vt ON vt.id = ve.visitor_type_id
      LEFT JOIN towers t ON t.tower_id = ve.tower_id
      LEFT JOIN flats f ON f.flat_id = ve.unit_id
      LEFT JOIN users ru ON ru.user_id = ve.resident_user_id
      WHERE ve.society_id = ?
      ORDER BY ve.requested_at DESC, ve.id DESC
      `,
      [societyId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("LIST GUARD VISITOR ENTRIES ERROR:", error);
    return res.status(500).json({ error: "Unable to load visitor entries" });
  }
};

exports.listResidentVisitorRequests = async (req, res) => {
  try {
    const residentUserId = getActorUserIdFromRequest(req, null);
    if (!residentUserId) {
      return res.status(400).json({ error: "resident user id is required" });
    }

    const [rows] = await db.query(
      `
      SELECT
        ve.*,
        vt.name AS visitor_type_name,
        t.tower_name,
        f.flat_number AS unit_number
      FROM visitor_entries ve
      LEFT JOIN visitor_types vt ON vt.id = ve.visitor_type_id
      LEFT JOIN towers t ON t.tower_id = ve.tower_id
      LEFT JOIN flats f ON f.flat_id = ve.unit_id
      WHERE ve.resident_user_id = ?
      ORDER BY ve.requested_at DESC, ve.id DESC
      `,
      [residentUserId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("LIST RESIDENT VISITOR REQUESTS ERROR:", error);
    return res.status(500).json({ error: "Unable to load visitor requests" });
  }
};

exports.approveVisitorEntry = async (req, res) => {
  try {
    const id = asNullableInt(req.params.id);
    const actorUserId = getActorUserIdFromRequest(req, null);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!actorUserId) {
      return res.status(400).json({ error: "resident user id is required" });
    }

    const entry = await fetchVisitorEntryWithJoins(id);
    if (!entry) return res.status(404).json({ error: "Visitor entry not found" });
    if (entry.status !== "PENDING") {
      return res.status(400).json({ error: "Only PENDING requests can be approved" });
    }

    const allowed = await canResidentActOnEntry({
      userId: actorUserId,
      flatId: entry.unit_id,
      residentUserId: entry.resident_user_id,
    });
    if (!allowed) {
      return res.status(403).json({ error: "Not allowed to approve this request" });
    }

    await db.query(
      `
      UPDATE visitor_entries
      SET status = 'APPROVED',
          approved_by_user_id = ?,
          approved_at = NOW(),
          rejection_reason = NULL
      WHERE id = ?
      `,
      [actorUserId, id]
    );

    const updated = await fetchVisitorEntryWithJoins(id);
    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_STATUS_UPDATED",
      description: "Visitor approved",
      status: "SUCCESS",
      old_value: { id, status: "PENDING" },
      new_value: { id, status: "APPROVED", approved_by_user_id: actorUserId },
    });
    return res.json(updated);
  } catch (error) {
    console.error("APPROVE VISITOR ENTRY ERROR:", error);
    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_STATUS_UPDATED",
      description: "Visitor approve failed",
      status: "ERROR",
      new_value: { id: req.params.id },
    });
    return res.status(500).json({ error: "Unable to approve request" });
  }
};

exports.rejectVisitorEntry = async (req, res) => {
  try {
    const id = asNullableInt(req.params.id);
    const actorUserId = getActorUserIdFromRequest(req, null);
    const rejectionReason = normalizeTrimmed(req.body?.rejection_reason);

    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!actorUserId) {
      return res.status(400).json({ error: "resident user id is required" });
    }
    if (!rejectionReason) {
      return res.status(400).json({ error: "rejection_reason is required" });
    }

    const entry = await fetchVisitorEntryWithJoins(id);
    if (!entry) return res.status(404).json({ error: "Visitor entry not found" });
    if (entry.status !== "PENDING") {
      return res.status(400).json({ error: "Only PENDING requests can be rejected" });
    }

    const allowed = await canResidentActOnEntry({
      userId: actorUserId,
      flatId: entry.unit_id,
      residentUserId: entry.resident_user_id,
    });
    if (!allowed) {
      return res.status(403).json({ error: "Not allowed to reject this request" });
    }

    await db.query(
      `
      UPDATE visitor_entries
      SET status = 'REJECTED',
          approved_by_user_id = ?,
          approved_at = NOW(),
          rejection_reason = ?
      WHERE id = ?
      `,
      [actorUserId, rejectionReason, id]
    );

    const updated = await fetchVisitorEntryWithJoins(id);
    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_STATUS_UPDATED",
      description: "Visitor rejected",
      status: "SUCCESS",
      old_value: { id, status: "PENDING" },
      new_value: {
        id,
        status: "REJECTED",
        approved_by_user_id: actorUserId,
        rejection_reason: rejectionReason,
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error("REJECT VISITOR ENTRY ERROR:", error);
    void writeAuditLog({
      req,
      module: "VISITOR",
      action: "VISITOR_STATUS_UPDATED",
      description: "Visitor reject failed",
      status: "ERROR",
      new_value: { id: req.params.id },
    });
    return res.status(500).json({ error: "Unable to reject request" });
  }
};

exports.checkInVisitorEntry = async (req, res) => {
  try {
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const entry = await fetchVisitorEntryWithJoins(id);
    if (!entry) return res.status(404).json({ error: "Visitor entry not found" });
    if (entry.status !== "APPROVED") {
      return res.status(400).json({ error: "Only APPROVED requests can be checked in" });
    }

    await db.query(
      `UPDATE visitor_entries
       SET status = 'CHECKED_IN',
           checkin_at = NOW()
       WHERE id = ?`,
      [id]
    );

    const updated = await fetchVisitorEntryWithJoins(id);
    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKIN",
      description: "Visitor verified / check-in",
      status: "SUCCESS",
      old_value: { id, status: "APPROVED" },
      new_value: { id, status: "CHECKED_IN" },
    });
    return res.json(updated);
  } catch (error) {
    console.error("CHECK-IN VISITOR ENTRY ERROR:", error);
    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKIN",
      description: "Visitor check-in failed",
      status: "ERROR",
      new_value: { id: req.params.id },
    });
    return res.status(500).json({ error: "Unable to check in visitor" });
  }
};

exports.checkOutVisitorEntry = async (req, res) => {
  try {
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const entry = await fetchVisitorEntryWithJoins(id);
    if (!entry) return res.status(404).json({ error: "Visitor entry not found" });
    if (entry.status !== "CHECKED_IN") {
      return res.status(400).json({ error: "Only CHECKED_IN entries can be checked out" });
    }

    await db.query(
      `UPDATE visitor_entries
       SET status = 'CHECKED_OUT',
           checkout_at = NOW()
       WHERE id = ?`,
      [id]
    );

    const updated = await fetchVisitorEntryWithJoins(id);
    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKOUT",
      description: "Visitor check-out",
      status: "SUCCESS",
      old_value: { id, status: "CHECKED_IN" },
      new_value: { id, status: "CHECKED_OUT" },
    });
    return res.json(updated);
  } catch (error) {
    console.error("CHECK-OUT VISITOR ENTRY ERROR:", error);
    void writeAuditLog({
      req,
      module: "GATE",
      action: "VISITOR_CHECKOUT",
      description: "Visitor check-out failed",
      status: "ERROR",
      new_value: { id: req.params.id },
    });
    return res.status(500).json({ error: "Unable to check out visitor" });
  }
};

exports.getVisitorEntryById = async (req, res) => {
  try {
    const id = asNullableInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    const entry = await fetchVisitorEntryWithJoins(id);
    if (!entry) return res.status(404).json({ error: "Visitor entry not found" });
    return res.json(entry);
  } catch (error) {
    console.error("GET VISITOR ENTRY ERROR:", error);
    return res.status(500).json({ error: "Unable to load visitor entry" });
  }
};

exports._constants = { VISITOR_ENTRY_STATUSES };
