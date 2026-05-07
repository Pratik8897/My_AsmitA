const db = require("../config/db");

// ---------- helpers ----------
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
    const { societyId } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        f.*,
        fl.floor_number,
        t.tower_id
      FROM flats f
      JOIN floors fl ON f.floor_id = fl.floor_id
      JOIN towers t ON fl.tower_id = t.tower_id
      WHERE t.society_id = ?
        AND (f.status IS NULL OR f.status != 'inactive')  -- ✅ FIX
      ORDER BY t.tower_id, fl.floor_number, f.flat_number
      `,
      [societyId]
    );

    res.json(rows);

  } catch (err) {
    console.error("GET FLATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GENERATE FLATS =================
exports.generateFlats = async (req, res) => {
  const conn = await db.getConnection();

  try {

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

exports.updateFlatStructure = async (req, res) => {
  const conn = await db.getConnection();
  let payload = req.body;

  if (!payload || (Array.isArray(payload) && payload.length === 0)) {
    return res.status(400).json({ error: "No updates provided" });
  }

  try {
    await conn.beginTransaction();

    // Support full floor payload from the frontend
    if (!Array.isArray(payload) && payload.tower_id && payload.floor_number) {
      const towerId = Number(payload.tower_id);
      const floorNumber = Number(payload.floor_number);
      const units = Array.isArray(payload.units) ? payload.units : [];

      if (!towerId || !floorNumber) {
        return res.status(400).json({ error: "tower_id and floor_number are required" });
      }

      let [floorRows] = await conn.query(
        "SELECT floor_id FROM floors WHERE tower_id = ? AND floor_number = ?",
        [towerId, floorNumber]
      );

      let floorId;
      if (!floorRows.length) {
        const [insertRes] = await conn.query(
          "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
          [towerId, floorNumber]
        );
        floorId = insertRes.insertId;
      } else {
        floorId = floorRows[0].floor_id;
      }

      const [existingFlats] = await conn.query(
        "SELECT flat_id, flat_number, unit_type, status FROM flats WHERE floor_id = ?",
        [floorId]
      );

      const existingByNumber = new Map(
        existingFlats.map((flat) => [flat.flat_number, flat])
      );
      const desiredNumbers = new Set();

      for (const unit of units) {
        const flatNumber = String(unit.number || unit.flat_number || "").trim();
        if (!flatNumber) continue;

        desiredNumbers.add(flatNumber);
        const unitType = unit.unit_type || unit.type || "1BHK";

        const existing = existingByNumber.get(flatNumber);
        if (existing) {
          if (existing.status !== "available" || existing.unit_type !== unitType) {
            await conn.query(
              "UPDATE flats SET status = 'available', unit_type = ? WHERE flat_id = ?",
              [unitType, existing.flat_id]
            );
          }
        } else {
          await conn.query(
            `INSERT INTO flats (floor_id, flat_number, unit_type, status)
             VALUES (?, ?, ?, 'available')`,
            [floorId, flatNumber, unitType]
          );
        }
      }

      for (const existing of existingFlats) {
        if (!desiredNumbers.has(existing.flat_number)) {
          await conn.query(
            "UPDATE flats SET status = 'inactive' WHERE flat_id = ?",
            [existing.flat_id]
          );
        }
      }

      await conn.commit();
      return res.json({ success: true });
    }

    const updates = Array.isArray(payload) ? payload : [];

    for (const u of updates) {
      if (u.action === "ADD") {
        const [floor] = await conn.query(
          "SELECT floor_id FROM floors WHERE tower_id = ? AND floor_number = ?",
          [u.tower_id, u.floor_number]
        );

        if (!floor.length) continue;

        const floorId = floor[0].floor_id;

        const [existing] = await conn.query(
          `SELECT flat_id, status FROM flats 
           WHERE floor_id = ? AND flat_number = ?`,
          [floorId, u.flat_number]
        );

        if (existing.length > 0) {
          await conn.query(
            `UPDATE flats 
             SET status = 'available', unit_type = ? 
             WHERE flat_id = ?`,
            [u.unit_type || "1BHK", existing[0].flat_id]
          );
        } else {
          await conn.query(
            `INSERT INTO flats 
             (floor_id, flat_number, unit_type, status)
             VALUES (?, ?, ?, 'available')`,
            [floorId, u.flat_number, u.unit_type || "1BHK"]
          );
        }
      }

      if (u.action === "REMOVE") {
        await conn.query(
          "UPDATE flats SET status = 'inactive' WHERE flat_id = ?",
          [u.flat_id]
        );
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("UPDATE STRUCTURE ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.bulkUpdateUnitTypes = async (req, res) => {
  const updates = req.body.updates || [];

  if (!updates.length) {
    return res.json({ success: true });
  }

  try {
    const queries = updates.map((u) =>
      db.query(
        "UPDATE flats SET unit_type = ? WHERE flat_id = ?",
        [u.unit_type, u.flat_id]
      )
    );

    await Promise.all(queries);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAssignedFlatIdsBySociety = async (req, res) => {
  try {
    const { societyId } = req.query;

    if (!societyId) {
      return res.status(400).json({ error: "societyId is required" });
    }

    const [rows] = await db.query(
      `
      SELECT f.flat_id
      FROM flats f
      JOIN floors fl ON f.floor_id = fl.floor_id
      JOIN towers t ON fl.tower_id = t.tower_id
      WHERE t.society_id = ?
      AND f.owner_id IS NOT NULL
      `,
      [societyId]
    );

    // return only flat_ids
    const flatIds = rows.map(r => r.flat_id);

    res.json(flatIds);

  } catch (err) {
    console.error("GET ASSIGNED FLATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.getFlatById = async (req, res) => {
  try {
    const { flatId } = req.params;

    if (!flatId) {
      return res.status(400).json({ error: "flatId is required" });
    }

    const [rows] = await db.query(
      `
      SELECT 
        f.*,
        fl.floor_number,
        t.tower_id
      FROM flats f
      JOIN floors fl ON f.floor_id = fl.floor_id
      JOIN towers t ON fl.tower_id = t.tower_id
      WHERE f.flat_id = ?
        AND (f.status IS NULL OR f.status != 'inactive')
      `,
      [flatId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Flat not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("GET FLAT BY ID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// exports.getFlatById = async (req, res) => {
//   try {
//     const { flatId } = req.params;

//     const [rows] = await db.query(`
//       SELECT 
//         f.*,
//         u.name AS owner_name,
//         u.phone,
//         u.email
//       FROM flats f
//       LEFT JOIN users u ON f.owner_id = u.user_id
//       WHERE f.flat_id = ?
//     `, [flatId]);

//     if (!rows.length) {
//       return res.status(404).json({ error: "Flat not found" });
//     }

//     res.json(rows[0]);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };