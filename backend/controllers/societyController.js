const db = require("../config/db");

const hasColumn = async (tableName, columnName) => {
  const [rows] = await db.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows.length > 0;
};

// ✅ GET ACTIVE SOCIETIES
exports.getSocieties = async (req, res) => {
  try {
    const supportsSoftDelete = await hasColumn("societies", "is_active");
    const [rows] = await db.query(
      supportsSoftDelete
        ? "SELECT * FROM societies WHERE is_active = 1 ORDER BY society_id DESC"
        : "SELECT * FROM societies ORDER BY society_id DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error("GET SOCIETIES ERROR:", err);
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
    const supportsSoftDelete = await hasColumn("societies", "is_active");

    if (supportsSoftDelete) {
      await db.query(
        `UPDATE societies 
         SET is_active = 0 
         WHERE society_id = ?`,
        [id]
      );

      return res.json({ message: "Society deactivated successfully" });
    }

    await db.query(
      "DELETE FROM societies WHERE society_id = ?",
      [id]
    );

    res.json({ message: "Society deleted successfully" });
  } catch (err) {
    console.error("DELETE SOCIETY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
