const db = require("../../config/db");
const { writeAuditLog } = require("../../utils/auditLogger");

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const toNullable = (value) => (isBlank(value) ? null : value);

const toNullableNumber = (value) => {
  if (isBlank(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

exports.getSocieties = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    let sql = "SELECT * FROM societies WHERE is_active = 1";
    const params = [];

    if (search) {
      sql += ` AND (
        LOWER(society_name) LIKE LOWER(?) OR
        LOWER(address) LIKE LOWER(?) OR
        LOWER(city) LIKE LOWER(?)
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY society_id DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("GET SOCIETIES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createSociety = async (req, res) => {
  try {
    const {
      society_name,
      city,
      state,
      country,
      pincode,
      contact_email,
      contact_number,
      address,
      google_map_url,
      latitude,
      longitude,
    } = req.body || {};

    if (isBlank(society_name)) return res.status(400).json({ error: "society_name is required" });
    if (isBlank(city)) return res.status(400).json({ error: "city is required" });
    if (isBlank(contact_number)) return res.status(400).json({ error: "contact_number is required" });

    const [result] = await db.query(
      `INSERT INTO societies (
        society_name, city, state, country, pincode,
        contact_email, contact_number, address, google_map_url,
        latitude, longitude, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        String(society_name).trim(),
        String(city).trim(),
        toNullable(state),
        toNullable(country) || "India",
        toNullable(pincode),
        toNullable(contact_email),
        String(contact_number).trim(),
        toNullable(address),
        toNullable(google_map_url),
        toNullableNumber(latitude),
        toNullableNumber(longitude),
      ]
    );

    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_CREATED",
      description: "Society created",
      status: "SUCCESS",
      new_value: {
        society_id: result.insertId,
        society_name,
        city,
        state,
        country,
        pincode,
        contact_email,
        contact_number,
      },
    });

    res.status(201).json({ message: "Society created successfully", society_id: result.insertId });
  } catch (error) {
    console.error("CREATE SOCIETY ERROR:", error);
    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_CREATED",
      description: "Society create failed",
      status: "ERROR",
      new_value: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

exports.updateSociety = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid society id" });

    const [existingRows] = await db.query(
      "SELECT * FROM societies WHERE society_id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0] || null;

    const {
      society_name,
      city,
      state,
      country,
      pincode,
      contact_email,
      contact_number,
      address,
      google_map_url,
      latitude,
      longitude,
    } = req.body || {};

    if (isBlank(society_name)) return res.status(400).json({ error: "society_name is required" });
    if (isBlank(city)) return res.status(400).json({ error: "city is required" });
    if (isBlank(contact_number)) return res.status(400).json({ error: "contact_number is required" });

    await db.query(
      `UPDATE societies SET
        society_name = ?,
        city = ?,
        state = ?,
        country = ?,
        pincode = ?,
        contact_email = ?,
        contact_number = ?,
        address = ?,
        google_map_url = ?,
        latitude = ?,
        longitude = ?
      WHERE society_id = ?
        AND is_active = 1`,
      [
        String(society_name).trim(),
        String(city).trim(),
        toNullable(state),
        toNullable(country) || "India",
        toNullable(pincode),
        toNullable(contact_email),
        String(contact_number).trim(),
        toNullable(address),
        toNullable(google_map_url),
        toNullableNumber(latitude),
        toNullableNumber(longitude),
        id,
      ]
    );

    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_UPDATED",
      description: "Society details updated",
      status: "SUCCESS",
      old_value: existing,
      new_value: { society_id: id, ...req.body },
    });

    res.json({ message: "Society updated successfully" });
  } catch (error) {
    console.error("UPDATE SOCIETY ERROR:", error);
    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_UPDATED",
      description: "Society update failed",
      status: "ERROR",
      new_value: { society_id: req.params.id, ...req.body },
    });
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSociety = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid society id" });

    const [existingRows] = await db.query(
      "SELECT * FROM societies WHERE society_id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0] || null;

    await db.query("UPDATE societies SET is_active = 0 WHERE society_id = ?", [id]);

    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_DELETED",
      description: "Society deleted (deactivated)",
      status: "SUCCESS",
      old_value: existing,
      new_value: { society_id: id, is_active: 0 },
    });
    res.json({ message: "Society deactivated successfully" });
  } catch (error) {
    console.error("DELETE SOCIETY ERROR:", error);
    void writeAuditLog({
      req,
      module: "SOCIETY",
      action: "SOCIETY_DELETED",
      description: "Society delete failed",
      status: "ERROR",
      new_value: { society_id: req.params.id },
    });
    res.status(500).json({ error: error.message });
  }
};
