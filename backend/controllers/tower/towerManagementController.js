const db = require("../../config/db");
const { writeAuditLog } = require("../../utils/auditLogger");

const normalizeTowerName = (value) => String(value || "").trim();

const ensureTowerIsActiveColumn = async () => {
  const [rows] = await db.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'towers'
       AND COLUMN_NAME = 'is_active'
     LIMIT 1`
  );

  if (rows.length === 0) {
    await db.query(`
      ALTER TABLE towers
      ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
    `);
  }
};

exports.getTowersBySociety = async (req, res) => {
  try {
    const societyId = Number(req.params.id);
    if (!societyId) return res.status(400).json({ error: "Invalid society id" });

    await ensureTowerIsActiveColumn();

    const [rows] = await db.query(
      `SELECT tower_id, society_id, tower_name
       FROM towers
       WHERE society_id = ? AND COALESCE(is_active, 1) = 1
       ORDER BY tower_id ASC`,
      [societyId]
    );

    res.json(rows);
  } catch (error) {
    console.error("GET TOWERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// Sync towers list for a society:
// - insert missing tower names
// - delete towers removed from list (cascades floors/flats)
exports.syncTowers = async (req, res) => {
  const societyId = Number(req.body?.society_id);
  const towers = Array.isArray(req.body?.towers) ? req.body.towers : [];

  if (!societyId || towers.length === 0) {
    return res.status(400).json({ error: "society_id and towers[] are required" });
  }

  const cleanedNames = Array.from(
    new Set(
      towers
        .map(normalizeTowerName)
        .filter((name) => name.length > 0)
    )
  );

  if (cleanedNames.length === 0) {
    return res.status(400).json({ error: "Provide at least one valid tower name" });
  }

  const conn = await db.getConnection();

  try {
    await ensureTowerIsActiveColumn();
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT tower_id, tower_name
       FROM towers
       WHERE society_id = ? AND COALESCE(is_active, 1) = 1`,
      [societyId]
    );

    const existingByName = new Map(existing.map((t) => [t.tower_name, t]));
    const desiredSet = new Set(cleanedNames);

    const towersToDelete = existing
      .filter((t) => !desiredSet.has(t.tower_name))
      .map((t) => t.tower_id);

    if (towersToDelete.length) {
      // This cascades floors/flats/merged_* due to FK rules.
      await conn.query("DELETE FROM towers WHERE tower_id IN (?)", [towersToDelete]);
    }

    const towersToInsert = cleanedNames.filter((name) => !existingByName.has(name));
    if (towersToInsert.length) {
      const values = towersToInsert.map((name) => [societyId, name, 1]);
      await conn.query(
        "INSERT INTO towers (society_id, tower_name, is_active) VALUES ?",
        [values]
      );
    }

    const [rows] = await conn.query(
      `SELECT tower_id, society_id, tower_name
       FROM towers
       WHERE society_id = ? AND COALESCE(is_active, 1) = 1
       ORDER BY tower_id ASC`,
      [societyId]
    );

    await conn.commit();

    void writeAuditLog({
      req,
      module: "TOWER",
      action: "TOWER_SYNC",
      description: "Tower created/deleted via sync",
      status: "SUCCESS",
      old_value: existing.map((t) => ({ tower_id: t.tower_id, tower_name: t.tower_name })),
      new_value: cleanedNames.map((name) => ({ tower_name: name })),
    });
    res.json(rows);
  } catch (error) {
    await conn.rollback();
    console.error("SYNC TOWERS ERROR:", error);
    void writeAuditLog({
      req,
      module: "TOWER",
      action: "TOWER_SYNC",
      description: "Tower sync failed",
      status: "ERROR",
      new_value: req.body,
    });
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

exports.deleteTower = async (req, res) => {
  const towerId = Number(req.params.towerId);
  if (!towerId) return res.status(400).json({ error: "Invalid tower id" });

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    // FK cascades handle floors/flats/merged_* cleanup.
    const [result] = await conn.query("DELETE FROM towers WHERE tower_id = ?", [towerId]);
    await conn.commit();

    void writeAuditLog({
      req,
      module: "TOWER",
      action: "TOWER_DELETED",
      description: "Tower deleted",
      status: result.affectedRows === 0 ? "FAILED" : "SUCCESS",
      new_value: { tower_id: towerId },
    });

    if (result.affectedRows === 0) return res.status(404).json({ error: "Tower not found" });

    res.json({ message: "Tower deleted successfully" });
  } catch (error) {
    await conn.rollback();
    console.error("DELETE TOWER ERROR:", error);
    void writeAuditLog({
      req,
      module: "TOWER",
      action: "TOWER_DELETED",
      description: "Tower delete failed",
      status: "ERROR",
      new_value: { tower_id: towerId },
    });
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};
