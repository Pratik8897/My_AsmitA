const db = require("../../config/db");

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

const ensureFlatsColumns = async () => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'flats'
       AND COLUMN_NAME IN ('unit_type','status','is_merged','merged_unit_id','merged_from')
    `
  );

  const existing = new Set(rows.map((r) => r.COLUMN_NAME));

  if (!existing.has("unit_type")) {
    await db.query("ALTER TABLE flats ADD COLUMN unit_type VARCHAR(20) NULL");
  }
  if (!existing.has("status")) {
    await db.query("ALTER TABLE flats ADD COLUMN status VARCHAR(20) NULL");
  }
  if (!existing.has("is_merged")) {
    await db.query("ALTER TABLE flats ADD COLUMN is_merged TINYINT(1) NOT NULL DEFAULT 0");
  }
  if (!existing.has("merged_unit_id")) {
    await db.query("ALTER TABLE flats ADD COLUMN merged_unit_id INT NULL");
  }
  if (!existing.has("merged_from")) {
    await db.query("ALTER TABLE flats ADD COLUMN merged_from VARCHAR(100) NULL");
  }
};

exports.mergeUnits = async (req, res) => {
  const flatIds = Array.isArray(req.body?.flat_ids) ? req.body.flat_ids.map((n) => Number(n)) : [];

  const uniqueFlatIds = Array.from(new Set(flatIds)).filter((n) => Number.isInteger(n) && n > 0);
  if (uniqueFlatIds.length < 2) {
    return res.status(400).json({ error: "flat_ids[] must contain at least 2 flat ids" });
  }

  const conn = await db.getConnection();

  try {
    await ensureFlatsColumns();
    await conn.beginTransaction();

    const [flats] = await conn.query(
      `SELECT flat_id, floor_id, flat_number, unit_type, status, is_merged, merged_unit_id
       FROM flats
       WHERE flat_id IN (?)`,
      [uniqueFlatIds]
    );

    if (flats.length !== uniqueFlatIds.length) {
      return res.status(400).json({ error: "Some flat_ids do not exist" });
    }

    const floorId = flats[0].floor_id;
    if (!isPositiveInt(floorId) || flats.some((f) => f.floor_id !== floorId)) {
      return res.status(400).json({ error: "All flats must be on the same floor" });
    }

    if (flats.some((f) => Number(f.is_merged) === 1 || f.merged_unit_id)) {
      return res.status(409).json({ error: "One or more flats are already merged" });
    }

    const memberNumbers = flats
      .map((f) => String(f.flat_number))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const mergedFlatNumber = memberNumbers.join("+");

    const [mergedFlatRes] = await conn.query(
      `INSERT INTO flats
       (floor_id, flat_number, unit_type, status, is_merged, merged_unit_id, merged_from)
       VALUES (?, ?, 'Jodi', 'available', 1, NULL, ?)`,
      [floorId, mergedFlatNumber, mergedFlatNumber]
    );

    const mergedFlatId = mergedFlatRes.insertId;

    const [mergedUnitRes] = await conn.query(
      `INSERT INTO merged_units (floor_id, merged_flat_id)
       VALUES (?, ?)`,
      [floorId, mergedFlatId]
    );

    const mergedUnitId = mergedUnitRes.insertId;

    await conn.query(
      "UPDATE flats SET merged_unit_id = ? WHERE flat_id = ?",
      [mergedUnitId, mergedFlatId]
    );

    await conn.query(
      "UPDATE flats SET is_merged = 1, merged_unit_id = ?, merged_from = ? WHERE flat_id IN (?)",
      [mergedUnitId, mergedFlatNumber, uniqueFlatIds]
    );

    const memberValues = uniqueFlatIds.map((id) => [mergedUnitId, id]);
    await conn.query(
      "INSERT INTO merged_unit_members (merged_unit_id, flat_id) VALUES ?",
      [memberValues]
    );

    await conn.commit();

    res.status(201).json({
      message: "Units merged successfully",
      merged_unit_id: mergedUnitId,
      merged_flat_id: mergedFlatId,
      merged_flat_number: mergedFlatNumber,
    });
  } catch (error) {
    await conn.rollback();
    console.error("MERGE UNITS ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

exports.unmergeUnits = async (req, res) => {
  const mergedUnitId = Number(req.body?.merged_unit_id);
  if (!isPositiveInt(mergedUnitId)) {
    return res.status(400).json({ error: "merged_unit_id is required" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [mergedRows] = await conn.query(
      `SELECT merged_unit_id, merged_flat_id
       FROM merged_units
       WHERE merged_unit_id = ?
       LIMIT 1`,
      [mergedUnitId]
    );

    if (mergedRows.length === 0) return res.status(404).json({ error: "Merged unit not found" });

    const mergedFlatId = mergedRows[0].merged_flat_id;

    const [members] = await conn.query(
      `SELECT flat_id
       FROM merged_unit_members
       WHERE merged_unit_id = ?`,
      [mergedUnitId]
    );

    const memberIds = members.map((m) => m.flat_id);

    if (memberIds.length) {
      await conn.query(
        "UPDATE flats SET is_merged = 0, merged_unit_id = NULL, merged_from = NULL WHERE flat_id IN (?)",
        [memberIds]
      );
    }

    // Deleting merged_units cascades merged_unit_members, and deleting merged flat removes the visual merged row.
    await conn.query("DELETE FROM flats WHERE flat_id = ?", [mergedFlatId]);
    await conn.query("DELETE FROM merged_units WHERE merged_unit_id = ?", [mergedUnitId]);

    await conn.commit();
    res.json({ message: "Units unmerged successfully" });
  } catch (error) {
    await conn.rollback();
    console.error("UNMERGE UNITS ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};
