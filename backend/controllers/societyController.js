const db = require("../config/db");

// ✅ GET ACTIVE SOCIETIES
exports.getSocieties = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM societies WHERE is_active = 1 ORDER BY society_id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE
exports.createSociety = async (req, res) => {
  try {
    const { society_name, address, google_pin_location } = req.body;

    const [result] = await db.query(
      `INSERT INTO societies (society_name, address, google_pin_location)
       VALUES (?, ?, ?)`,
      [society_name, address, google_pin_location]
    );

    res.json({
      message: "Society created successfully",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE
exports.updateSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const { society_name, address, google_pin_location } = req.body;

    await db.query(
      `UPDATE societies 
       SET society_name = ?, address = ?, google_pin_location = ?
       WHERE society_id = ?`,
      [society_name, address, google_pin_location, id]
    );

    res.json({ message: "Society updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ SOFT DELETE (IMPORTANT)
exports.deleteSociety = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE societies 
       SET is_active = 0 
       WHERE society_id = ?`,
      [id]
    );

    res.json({ message: "Society deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};