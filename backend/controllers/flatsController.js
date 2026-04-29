const db = require("../config/db");

// ---------- helpers ----------
const ensureFlatsColumns = async () => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'flats'
       AND COLUMN_NAME IN ('unit_type','status','is_merged','merged_unit_id','merged_from','owner_id')`
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
  if (!existing.has("owner_id")) {
    await db.query("ALTER TABLE flats ADD COLUMN owner_id INT NULL");
  }
};

const ensureUserFlatMappingTable = async () => {
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
};

const parseUnits = (value, type) => {
  if (!value) return [];

  if (type === "range") {
    const [s, e] = value.split("-").map(Number);
    if (isNaN(s) || isNaN(e) || s > e) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }

  if (type === "list") {
    return value.split(",").map(v => Number(v.trim())).filter(Boolean);
  }

  return [];
};

const hasOverlap = (sets) => {
  const seen = new Set();
  for (const arr of sets) {
    for (const n of arr) {
      if (seen.has(n)) return true;
      seen.add(n);
    }
  }
  return false;
};

// ================= GET FLATS BY SOCIETY =================
exports.getFlatsBySociety = async (req, res) => {
  try {
    await ensureFlatsColumns();
    const { societyId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        f.*,
        fl.floor_number,   -- ✅ ADD THIS
        t.tower_id
      FROM flats f
      JOIN floors fl ON f.floor_id = fl.floor_id
      JOIN towers t ON fl.tower_id = t.tower_id
      WHERE t.society_id = ?
      ORDER BY t.tower_id, fl.floor_number, f.flat_number
    `, [societyId]);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GENERATE FLATS =================
exports.generateFlats = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await ensureFlatsColumns();
    const {
      floor_ids,
      units_per_floor,
      unit_types,
      starting_number = 1,
      merged_units = []
    } = req.body;

    if (!Array.isArray(floor_ids) || !floor_ids.length) {
      return res.status(400).json({ error: "floor_ids required" });
    }

    if (!units_per_floor || units_per_floor < 1) {
      return res.status(400).json({ error: "units_per_floor invalid" });
    }

    // ---------- 1. Generate base flats ----------
    let counter = starting_number;
    const flats = [];

    for (const floorId of floor_ids) {
      for (let i = 0; i < units_per_floor; i++) {
        flats.push({
          floor_id: floorId,
          flat_number: `${String(i + 1).padStart(2, "0")}`,
          unit_type: unit_types?.[i] || "1BHK",
          is_merged: 0,
          merged_from: null,
          original_number: counter++
        });
      }
    }

    // ---------- 2. Validate merges ----------
    const parsedSets = merged_units
      .map(m => parseUnits(m.value, m.type))
      .filter(a => a.length);

    if (hasOverlap(parsedSets)) {
      return res.status(400).json({ error: "Merged ranges overlap" });
    }

    const allOriginals = new Set(flats.map(f => f.original_number));

    for (const set of parsedSets) {
      for (const n of set) {
        if (!allOriginals.has(n)) {
          return res.status(400).json({ error: `Invalid merge reference: ${n}` });
        }
      }
    }

    // ---------- 3. Apply merges ----------
    const mergedRows = [];

    merged_units.forEach((m) => {
      const numbers = parseUnits(m.value, m.type);

      numbers.forEach(n => {
        const f = flats.find(x => x.original_number === n);
        if (f) {
          f.is_merged = 1;
          f.merged_from = m.value;
        }
      });

      const first = flats.find(x => x.original_number === numbers[0]);

      mergedRows.push({
        floor_id: first?.floor_id || floor_ids[0],
        flat_number: `M-${m.value}`,
        unit_type: "MERGED",
        is_merged: 1,
        merged_from: m.value
      });
    });

    // ---------- 4. Insert (transaction) ----------
    await conn.beginTransaction();

    const insertValues = flats.map(f => [
      f.floor_id,
      f.flat_number,
      f.unit_type,
      f.is_merged,
      f.merged_from
    ]);

    if (insertValues.length) {
      await conn.query(
        `INSERT INTO flats (floor_id, flat_number, unit_type, is_merged, merged_from)
         VALUES ?`,
        [insertValues]
      );
    }

    if (mergedRows.length) {
      const mergeValues = mergedRows.map(f => [
        f.floor_id,
        f.flat_number,
        f.unit_type,
        f.is_merged,
        f.merged_from
      ]);

      await conn.query(
        `INSERT INTO flats (floor_id, flat_number, unit_type, is_merged, merged_from)
         VALUES ?`,
        [mergeValues]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      inserted: insertValues.length + mergedRows.length,
      merged_groups: mergedRows.length
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};


exports.getFlatById = async (req, res) => {
  try {
    await ensureFlatsColumns();
    await ensureUserFlatMappingTable();
    const { flatId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        f.*,
        COALESCE(u_owner.full_name, u_flat.full_name) AS owner_name,
        COALESCE(u_owner.mobile_number, u_flat.mobile_number) AS phone,
        COALESCE(u_owner.email_id, u_flat.email_id) AS email,
        ufm_owner.ownership_type AS ownership_type
      FROM flats f
      LEFT JOIN user_flat_mapping ufm_owner
        ON ufm_owner.flat_id = f.flat_id
       AND ufm_owner.ownership_type = 'Owner'
      LEFT JOIN users u_owner ON u_owner.user_id = ufm_owner.user_id
      -- fallback for older data that used flats.owner_id
      LEFT JOIN users u_flat ON f.owner_id = u_flat.user_id
      WHERE f.flat_id = ?
    `, [flatId]);

    if (!rows.length) {
      return res.status(404).json({ error: "Flat not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("GET FLAT BY ID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignedFlatIdsBySociety = async (req, res) => {
  try {
    await ensureUserFlatMappingTable();

    const societyId = req.query.societyId ? Number(req.query.societyId) : null;
    if (!societyId) return res.status(400).json({ error: "societyId is required" });

    const [rows] = await db.query(
      `SELECT DISTINCT ufm.flat_id
       FROM user_flat_mapping ufm
       JOIN flats f ON f.flat_id = ufm.flat_id
       JOIN floors fl ON fl.floor_id = f.floor_id
       JOIN towers t ON t.tower_id = fl.tower_id
       WHERE t.society_id = ?`,
      [societyId]
    );

    res.json(rows.map((r) => r.flat_id));
  } catch (err) {
    console.error("GET ASSIGNED FLATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
