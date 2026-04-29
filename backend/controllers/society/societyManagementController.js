const db = require("../../config/db");

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

    res.status(201).json({ message: "Society created successfully", society_id: result.insertId });
  } catch (error) {
    console.error("CREATE SOCIETY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSociety = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid society id" });

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

    res.json({ message: "Society updated successfully" });
  } catch (error) {
    console.error("UPDATE SOCIETY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSociety = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid society id" });

    await db.query("UPDATE societies SET is_active = 0 WHERE society_id = ?", [id]);
    res.json({ message: "Society deactivated successfully" });
  } catch (error) {
    console.error("DELETE SOCIETY ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

