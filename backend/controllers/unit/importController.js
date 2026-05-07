const fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const db = require("../../config/db");

const safeUnlink = (path) => {
  try {
    if (path && fs.existsSync(path)) fs.unlinkSync(path);
  } catch (_) {
    // ignore cleanup errors
  }
};

const asTrimmedString = (value) => String(value ?? "").trim();

const parseFloorNumber = (value) => {
  const n = Number(asTrimmedString(value));
  return Number.isFinite(n) ? n : NaN;
};

// Helper: parse CSV / Excel
const parseFile = async (file) => {
  const filePath = file.path;
  const ext = file.originalname.split(".").pop().toLowerCase();

  let data = [];

  if (ext === "csv") {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            mapHeaders: ({ header }) => (header ? header.trim() : header),
          })
        )
        .on("data", (row) => data.push(row))
        .on("end", resolve)
        .on("error", reject);
    });
  } else if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error("Unsupported file type");
  }

  return data;
};

const findOrCreateFloor = async (towerId, floorNumber) => {
  const [floorRows] = await db.query(
    "SELECT floor_id FROM floors WHERE tower_id=? AND floor_number=?",
    [towerId, floorNumber]
  );

  if (floorRows.length) return floorRows[0].floor_id;

  const [result] = await db.query(
    "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
    [towerId, floorNumber]
  );

  return result.insertId;
};

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
    await db.query(
      "ALTER TABLE flats ADD COLUMN is_merged TINYINT(1) NOT NULL DEFAULT 0"
    );
  }
  if (!existing.has("merged_unit_id")) {
    await db.query("ALTER TABLE flats ADD COLUMN merged_unit_id INT NULL");
  }
  if (!existing.has("merged_from")) {
    await db.query("ALTER TABLE flats ADD COLUMN merged_from VARCHAR(100) NULL");
  }
};

const ensureMergedTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS merged_units (
      merged_unit_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      floor_id INT NOT NULL,
      merged_flat_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_merged_units_floor (floor_id),
      INDEX idx_merged_units_flat (merged_flat_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS merged_unit_members (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      merged_unit_id INT NOT NULL,
      flat_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_merged_member (merged_unit_id, flat_id),
      INDEX idx_mum_flat (flat_id)
    )
  `);
};

const parseMergedMembers = (value) => {
  const raw = asTrimmedString(value);
  if (!raw) return [];

  return raw
    .split(/[+,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

exports.importUnits = async (req, res) => {
  const errors = [];
  let insertedCount = 0;
  let updatedCount = 0;
  let reactivatedCount = 0;
  let mergedGroupCount = 0;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await ensureFlatsColumns();
    await ensureMergedTables();

    const rows = await parseFile(req.file);

    const towerIdFromReq = req.body?.tower_id ? Number(req.body.tower_id) : null;
    const societyIdFromReq = req.body?.society_id
      ? Number(req.body.society_id)
      : null;

    let lockedTowerId = null;
    let lockedSocietyId = null;

    // Preferred mode: user selects society + tower in UI and file contains only units
    if (towerIdFromReq) {
      const [towerRows] = await db.query(
        "SELECT tower_id, society_id FROM towers WHERE tower_id = ?",
        [towerIdFromReq]
      );

      if (!towerRows.length) {
        safeUnlink(req.file.path);
        return res.status(400).json({ error: "Invalid tower_id" });
      }

      if (
        societyIdFromReq &&
        Number(towerRows[0].society_id) !== societyIdFromReq
      ) {
        safeUnlink(req.file.path);
        return res
          .status(400)
          .json({ error: "tower_id does not belong to selected society" });
      }

      lockedTowerId = towerIdFromReq;
      lockedSocietyId = Number(towerRows[0].society_id);
    } else if (societyIdFromReq) {
      // Society-locked mode: user selects society in UI and file contains tower_name + units
      const [societyRows] = await db.query(
        "SELECT society_id FROM societies WHERE society_id = ?",
        [societyIdFromReq]
      );

      if (!societyRows.length) {
        safeUnlink(req.file.path);
        return res.status(400).json({ error: "Invalid society_id" });
      }

      lockedSocietyId = societyIdFromReq;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const towerNameFromRow = asTrimmedString(row?.tower_name);
        const floorNumber = parseFloorNumber(
          row?.floor_number ?? row?.floor ?? row?.Floor
        );
        const flatNumber = asTrimmedString(
          row?.flat_number ?? row?.flat ?? row?.Flat
        );
        const unitType = asTrimmedString(row?.unit_type ?? row?.type ?? row?.UnitType);
        const mergedFrom = asTrimmedString(
          row?.merged_from ?? row?.mergedFrom ?? row?.MergedFrom
        );

        // Validation in locked-tower mode
        if (lockedTowerId) {
          if (!Number.isFinite(floorNumber) || !flatNumber) {
            errors.push({
              row: i + 1,
              reason: "Missing required fields (floor_number, flat_number)",
            });
            continue;
          }
        }

        // Tower resolution
        let towerId = lockedTowerId;

        // Society-locked mode: tower_name must exist in file; do NOT create towers
        if (!towerId && lockedSocietyId) {
          const towerName = towerNameFromRow;

          if (
            !towerName ||
            !Number.isFinite(floorNumber) ||
            !flatNumber
          ) {
            errors.push({
              row: i + 1,
              reason:
                "Missing required fields (tower_name, floor_number, flat_number)",
            });
            continue;
          }

          const [towerRows] = await db.query(
            "SELECT tower_id FROM towers WHERE tower_name=? AND society_id=?",
            [towerName, lockedSocietyId]
          );

          if (towerRows.length === 0) {
            errors.push({
              row: i + 1,
              reason: `Conflict: tower '${towerName}' not found in selected society`,
            });
            continue;
          }

          towerId = towerRows[0].tower_id;
        }

        // Legacy mode (kept for backward compatibility): file contains society_name + tower_name (may create)
        if (!towerId && !lockedSocietyId) {
          const societyName = asTrimmedString(row?.society_name);
          const towerName = asTrimmedString(row?.tower_name);

          if (
            !societyName ||
            !towerName ||
            !Number.isFinite(floorNumber) ||
            !flatNumber
          ) {
            errors.push({ row: i + 1, reason: "Missing required fields" });
            continue;
          }

          const [societyRows] = await db.query(
            "SELECT society_id FROM societies WHERE society_name=?",
            [societyName]
          );

          let societyId;
          if (societyRows.length === 0) {
            const [result] = await db.query(
              "INSERT INTO societies (society_name) VALUES (?)",
              [societyName]
            );
            societyId = result.insertId;
          } else {
            societyId = societyRows[0].society_id;
          }

          const [towerRows] = await db.query(
            "SELECT tower_id FROM towers WHERE tower_name=? AND society_id=?",
            [towerName, societyId]
          );

          if (towerRows.length === 0) {
            const [result] = await db.query(
              "INSERT INTO towers (tower_name, society_id) VALUES (?, ?)",
              [towerName, societyId]
            );
            towerId = result.insertId;
          } else {
            towerId = towerRows[0].tower_id;
          }
        }

        const floorId = await findOrCreateFloor(towerId, floorNumber);

        // Collect merged group definitions so we can create merged tables + members.
        // We accept either:
        // - merged_from filled (e.g. "101+102") on member rows or on a "Jodi" row
        // - a "Jodi" row where flat_number itself is "101+102"
        const mergedKeyRaw =
          mergedFrom || (flatNumber.includes("+") ? flatNumber : "");
        const mergedMembers =
          parseMergedMembers(mergedKeyRaw) ||
          (flatNumber.includes("+") ? parseMergedMembers(flatNumber) : []);

        if (lockedSocietyId && mergedKeyRaw && mergedMembers.length >= 2) {
          row.__merged_group = {
            rowIndex: i + 1,
            towerId,
            floorId,
            mergedFlatNumber: mergedMembers
              .slice()
              .sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true })
              )
              .join("+"),
            memberFlatNumbers: mergedMembers,
          };
        }

        const isJodiRow =
          flatNumber.includes("+") || String(unitType).toLowerCase() === "jodi";
        const deferMergeFlagsForMemberRow =
          lockedSocietyId && mergedKeyRaw && mergedMembers.length >= 2 && !isJodiRow;

        // We ignore any `is_merged` column in the file and derive merge state from `merged_from`
        // (and Jodi rows) only.
        const isMergedForThisRow =
          !deferMergeFlagsForMemberRow &&
          isJodiRow &&
          mergedKeyRaw &&
          mergedMembers.length >= 2
            ? 1
            : 0;

        // If user provides a Jodi row, it must represent the merged flat itself.
        // Common Excel mistake: flat_number filled as one member (e.g. 203) while unit_type=Jodi and merged_from=201+202.
        // In that case, we skip inserting that incorrect row and only use it to define the merged group.
        if (
          lockedSocietyId &&
          isJodiRow &&
          mergedKeyRaw &&
          mergedMembers.length >= 2 &&
          flatNumber &&
          !flatNumber.includes("+") &&
          flatNumber !== mergedKeyRaw
        ) {
          continue;
        }

        // FLAT (upsert/reactivate)
        const [existingRows] = await db.query(
          "SELECT flat_id, status, owner_id FROM flats WHERE floor_id=? AND flat_number=?",
          [floorId, flatNumber]
        );

        if (existingRows.length > 0) {
          const existing = existingRows[0];

          if (existing.owner_id) {
            errors.push({
              row: i + 1,
              reason: `Conflict: unit ${flatNumber} is already assigned`,
            });
            continue;
          }

          const wasInactive = existing.status === "inactive";

          await db.query(
            `UPDATE flats
             SET status = 'available',
                 unit_type = ?,
                 is_merged = ?,
                 merged_unit_id = ?,
                 merged_from = ?
             WHERE flat_id = ?`,
            [
              unitType || null,
              isMergedForThisRow,
              null,
              isMergedForThisRow ? (mergedKeyRaw || null) : null,
              existing.flat_id,
            ]
          );

          if (wasInactive) reactivatedCount++;
          else updatedCount++;

          continue;
        }

        await db.query(
          `INSERT INTO flats
           (floor_id, flat_number, unit_type, is_merged, status, merged_unit_id, merged_from)
           VALUES (?, ?, ?, ?, 'available', NULL, ?)`,
          [
            floorId,
            flatNumber,
            unitType || null,
            isMergedForThisRow,
            isMergedForThisRow ? (mergedKeyRaw || null) : null,
          ]
        );

        insertedCount++;
      } catch (err) {
        errors.push({
          row: i + 1,
          reason: err.message,
        });
      }
    }

    // Second pass: apply merged groups (society-mode only)
    const mergedGroups = rows
      .map((r) => r && r.__merged_group)
      .filter(Boolean);

    if (lockedSocietyId && mergedGroups.length) {
      // Group by (floorId + mergedFlatNumber)
      const byKey = new Map();
      for (const g of mergedGroups) {
        const key = `${g.floorId}:${g.mergedFlatNumber}`;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, {
            ...g,
            memberFlatNumbers: new Set(g.memberFlatNumbers),
            rowIndexes: [g.rowIndex],
          });
        } else {
          g.memberFlatNumbers.forEach((n) => existing.memberFlatNumbers.add(n));
          existing.rowIndexes.push(g.rowIndex);
        }
      }

      for (const group of byKey.values()) {
        const mergedFlatNumber = group.mergedFlatNumber;
        const memberNumbers = Array.from(group.memberFlatNumbers)
          .map((n) => String(n).trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        if (memberNumbers.length < 2) continue;

        // Validate group doesn't contain duplicates / self-reference.
        if (memberNumbers.includes(mergedFlatNumber)) {
          errors.push({
            row: group.rowIndexes[0],
            reason: `Invalid merged_from: contains merged flat itself (${mergedFlatNumber})`,
          });
          continue;
        }

        try {
          // Ensure member flats exist (create if missing)
          const [existingMembers] = await db.query(
            "SELECT flat_id, flat_number, owner_id, is_merged, merged_unit_id FROM flats WHERE floor_id=? AND flat_number IN (?)",
            [group.floorId, memberNumbers]
          );

          const existingByNumber = new Map(
            existingMembers.map((m) => [String(m.flat_number), m])
          );

          for (const n of memberNumbers) {
            if (existingByNumber.has(n)) continue;

            await db.query(
              `INSERT INTO flats
               (floor_id, flat_number, unit_type, is_merged, status, merged_unit_id, merged_from)
               VALUES (?, ?, NULL, 0, 'available', NULL, NULL)`,
              [group.floorId, n]
            );
          }

          const [freshMembers] = await db.query(
            "SELECT flat_id, flat_number, owner_id, is_merged, merged_unit_id FROM flats WHERE floor_id=? AND flat_number IN (?)",
            [group.floorId, memberNumbers]
          );

          const memberIds = [];
          for (const m of freshMembers) {
            if (m.owner_id) {
              throw new Error(
                `Conflict: unit ${m.flat_number} is already assigned`
              );
            }
            if (Number(m.is_merged) === 1 || m.merged_unit_id) {
              // already merged (possibly same group, but we don't know); treat as conflict
              throw new Error(`Conflict: unit ${m.flat_number} is already merged`);
            }
            memberIds.push(m.flat_id);
          }

          // Create or reuse merged flat row
          const [existingMergedFlatRows] = await db.query(
            "SELECT flat_id, merged_unit_id FROM flats WHERE floor_id=? AND flat_number=? AND unit_type='Jodi' LIMIT 1",
            [group.floorId, mergedFlatNumber]
          );

          let mergedFlatId;
          let mergedUnitId;

          if (existingMergedFlatRows.length) {
            mergedFlatId = existingMergedFlatRows[0].flat_id;
            mergedUnitId = existingMergedFlatRows[0].merged_unit_id;

            if (!mergedUnitId) {
              const [mergedUnitRes] = await db.query(
                `INSERT INTO merged_units (floor_id, merged_flat_id)
                 VALUES (?, ?)`,
                [group.floorId, mergedFlatId]
              );
              mergedUnitId = mergedUnitRes.insertId;
              await db.query(
                "UPDATE flats SET merged_unit_id = ?, is_merged = 1, merged_from = ? WHERE flat_id = ?",
                [mergedUnitId, mergedFlatNumber, mergedFlatId]
              );
            }

            await db.query(
              "DELETE FROM merged_unit_members WHERE merged_unit_id = ?",
              [mergedUnitId]
            );
          } else {
            const [mergedFlatRes] = await db.query(
              `INSERT INTO flats
               (floor_id, flat_number, unit_type, status, is_merged, merged_unit_id, merged_from)
               VALUES (?, ?, 'Jodi', 'available', 1, NULL, ?)`,
              [group.floorId, mergedFlatNumber, mergedFlatNumber]
            );
            mergedFlatId = mergedFlatRes.insertId;

            const [mergedUnitRes] = await db.query(
              `INSERT INTO merged_units (floor_id, merged_flat_id)
               VALUES (?, ?)`,
              [group.floorId, mergedFlatId]
            );
            mergedUnitId = mergedUnitRes.insertId;

            await db.query(
              "UPDATE flats SET merged_unit_id = ? WHERE flat_id = ?",
              [mergedUnitId, mergedFlatId]
            );
          }

          // Update member flats and create member rows
          await db.query(
            "UPDATE flats SET is_merged = 1, status='available', merged_unit_id = ?, merged_from = ? WHERE flat_id IN (?)",
            [mergedUnitId, mergedFlatNumber, memberIds]
          );

          const memberValues = memberIds.map((id) => [mergedUnitId, id]);
          await db.query(
            "INSERT IGNORE INTO merged_unit_members (merged_unit_id, flat_id) VALUES ?",
            [memberValues]
          );

          mergedGroupCount++;
        } catch (err) {
          errors.push({
            row: group.rowIndexes[0],
            reason: err.message,
          });
        }
      }
    }

    safeUnlink(req.file.path);

    return res.json({
      message: "Import completed",
      successCount: insertedCount + updatedCount + reactivatedCount,
      insertedCount,
      updatedCount,
      reactivatedCount,
      mergedGroupCount,
      failedCount: errors.length,
      errors,
    });
  } catch (err) {
    console.error(err);
    if (req.file) safeUnlink(req.file.path);

    return res.status(500).json({
      error: "Import failed",
      details: err.message,
    });
  }
};
