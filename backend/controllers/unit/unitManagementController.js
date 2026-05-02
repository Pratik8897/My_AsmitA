const db = require("../../config/db");

const UNIT_TYPES = new Set(["1BHK", "2BHK", "3BHK", "Jodi"]);
const UNIT_STATUS = new Set(["available", "occupied"]);

const normalizeUnitType = (value) => (UNIT_TYPES.has(value) ? value : "1BHK");
const normalizeStatus = (value) => (UNIT_STATUS.has(value) ? value : "available");

const ensureFlatsColumns = async () => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'flats'
       AND COLUMN_NAME IN ('unit_type','status','is_merged','merged_unit_id','merged_from')`
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



// exports.generateUnits = async (req, res) => {
//   const configs = Array.isArray(req.body?.configs) ? req.body.configs : null;
//   if (!configs || configs.length === 0) return res.status(400).json({ error: "configs[] is required" });

//   const conn = await db.getConnection();

//   try {
//     await ensureTowerIsActiveColumn();
//     await ensureFlatsColumns();
//     await conn.beginTransaction();

//     for (const config of configs) {
//       const towerId = Number(config?.tower_id);
//       const totalFloors = Number(config?.total_floors);
//       const unitsPerFloor = Number(config?.units_per_floor);
//       const unitTypes = Array.isArray(config?.unit_types) ? config.unit_types : null;

//       if (!towerId || !Number.isInteger(totalFloors) || totalFloors <= 0 || !Number.isInteger(unitsPerFloor) || unitsPerFloor <= 0) {
//         return res.status(400).json({ error: "Each config needs tower_id, total_floors (>0), units_per_floor (>0)" });
//       }

//       // Overwrite mode: delete floors, cascades flats + merged_*.
//       await conn.query("DELETE FROM floors WHERE tower_id = ?", [towerId]);

//       for (let floor = 1; floor <= totalFloors; floor++) {
//         const [floorRes] = await conn.query(
//           "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
//           [towerId, floor]
//         );

//         const floorId = floorRes.insertId;
//         const flatRows = [];

//         for (let unitIndex = 1; unitIndex <= unitsPerFloor; unitIndex++) {
//           const flatNumber = `${floor}${unitIndex.toString().padStart(2, "0")}`;
//           const unitType = normalizeUnitType(unitTypes ? unitTypes[unitIndex - 1] : "1BHK");

//           flatRows.push([
//             floorId,
//             flatNumber,
//             unitType,
//             normalizeStatus(config?.status || "available"),
//             0,
//             null,
//             null,
//           ]);
//         }

//         await conn.query(
//           `INSERT INTO flats
//            (floor_id, flat_number, unit_type, status, is_merged, merged_unit_id, merged_from)
//            VALUES ?`,
//           [flatRows]
//         );
//       }
//     }

//     await conn.commit();
//     res.json({ message: "Units generated successfully" });
//   } catch (error) {
//     await conn.rollback();
//     console.error("GENERATE UNITS ERROR:", error);
//     res.status(500).json({ error: error.message });
//   } finally {
//     conn.release();
//   }
// };

exports.generateUnits = async (req, res) => {
  const configs = Array.isArray(req.body?.configs) ? req.body.configs : null;
  if (!configs || configs.length === 0) {
    return res.status(400).json({ error: "configs[] is required" });
  }

  const conn = await db.getConnection();

  try {
    await ensureTowerIsActiveColumn();
    await ensureFlatsColumns();
    await conn.beginTransaction();

    for (const config of configs) {
      const towerId = Number(config?.tower_id);

      if (!towerId) {
        return res.status(400).json({ error: "tower_id is required" });
      }

      // 🔥 DELETE OLD DATA
      await conn.query("DELETE FROM floors WHERE tower_id = ?", [towerId]);

      // =========================================================
      // ✅ NEW MODE (floorConfigs)
      // =========================================================
      if (Array.isArray(config?.floors)) {
        for (const floorObj of config.floors) {
          const floorNumber = Number(floorObj.floor);
          const units = Array.isArray(floorObj.units)
            ? floorObj.units
            : [];

          if (!floorNumber || units.length === 0) continue;

          const [floorRes] = await conn.query(
            "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
            [towerId, floorNumber]
          );

          const floorId = floorRes.insertId;
          const flatRows = [];

          units.forEach((type, index) => {
            const flatNumber = `${floorNumber}${String(index + 1).padStart(2, "0")}`;

            flatRows.push([
              floorId,
              flatNumber,
              normalizeUnitType(type || "1BHK"),
              normalizeStatus(config?.status || "available"),
              0,
              null,
              null,
            ]);
          });

          await conn.query(
            `INSERT INTO flats
            (floor_id, flat_number, unit_type, status, is_merged, merged_unit_id, merged_from)
            VALUES ?`,
            [flatRows]
          );
        }
      }

      // =========================================================
      // ✅ OLD MODE (fallback - your existing logic)
      // =========================================================
      else {
        const totalFloors = Number(config?.total_floors);
        const unitsPerFloor = Number(config?.units_per_floor);
        const unitTypes = Array.isArray(config?.unit_types)
          ? config.unit_types
          : null;

        if (
          !Number.isInteger(totalFloors) ||
          totalFloors <= 0 ||
          !Number.isInteger(unitsPerFloor) ||
          unitsPerFloor <= 0
        ) {
          return res.status(400).json({
            error:
              "Provide either floors[] OR total_floors + units_per_floor",
          });
        }

        for (let floor = 1; floor <= totalFloors; floor++) {
          const [floorRes] = await conn.query(
            "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
            [towerId, floor]
          );

          const floorId = floorRes.insertId;
          const flatRows = [];

          for (let unitIndex = 1; unitIndex <= unitsPerFloor; unitIndex++) {
            const flatNumber = `${floor}${unitIndex
              .toString()
              .padStart(2, "0")}`;

            const unitType = normalizeUnitType(
              unitTypes ? unitTypes[unitIndex - 1] : "1BHK"
            );

            flatRows.push([
              floorId,
              flatNumber,
              unitType,
              normalizeStatus(config?.status || "available"),
              0,
              null,
              null,
            ]);
          }

          await conn.query(
            `INSERT INTO flats
            (floor_id, flat_number, unit_type, status, is_merged, merged_unit_id, merged_from)
            VALUES ?`,
            [flatRows]
          );
        }
      }
    }

    await conn.commit();
    res.json({ message: "Units generated successfully" });
  } catch (error) {
    await conn.rollback();
    console.error("GENERATE UNITS ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};


exports.getSocietyConfigs = async (req, res) => {
  try {
    const societyId = Number(req.params.id);
    if (!societyId) return res.status(400).json({ error: "Invalid society id" });

    await ensureTowerIsActiveColumn();

    const [towers] = await db.query(
      `SELECT tower_id, tower_name
       FROM towers
       WHERE society_id = ? AND COALESCE(is_active, 1) = 1
       ORDER BY tower_id ASC`,
      [societyId]
    );

    const towerIds = towers.map((t) => t.tower_id);
    if (towerIds.length === 0) return res.json([]);

    const [summary] = await db.query(
      `SELECT
         t.tower_id,
         COUNT(DISTINCT f.floor_id) AS total_floors,
         CASE
           WHEN COUNT(DISTINCT f.floor_id) = 0 THEN 0
           ELSE FLOOR(COUNT(fl.flat_id) / COUNT(DISTINCT f.floor_id))
         END AS units_per_floor
       FROM towers t
       LEFT JOIN floors f ON f.tower_id = t.tower_id
       LEFT JOIN flats fl ON fl.floor_id = f.floor_id
       WHERE t.tower_id IN (?)
       GROUP BY t.tower_id`,
      [towerIds]
    );

    const summaryByTower = new Map(summary.map((r) => [r.tower_id, r]));

    // Optional: include merged groups (for UI)
    const [merged] = await db.query(
      `SELECT
         mu.merged_unit_id,
         mu.floor_id,
         mu.merged_flat_id,
         mf.flat_number AS merged_flat_number
       FROM merged_units mu
       JOIN flats mf ON mf.flat_id = mu.merged_flat_id
       JOIN floors fl ON fl.floor_id = mu.floor_id
       JOIN towers t ON t.tower_id = fl.tower_id
       WHERE t.society_id = ?`,
      [societyId]
    );

    const response = towers.map((t) => {
      const s = summaryByTower.get(t.tower_id) || {};
      return {
        tower_id: t.tower_id,
        tower_name: t.tower_name,
        total_floors: Number(s.total_floors || 0),
        units_per_floor: Number(s.units_per_floor || 0),
      };
    });

    res.json({ towers: response, merged_units: merged });
  } catch (error) {
    console.error("GET CONFIGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
