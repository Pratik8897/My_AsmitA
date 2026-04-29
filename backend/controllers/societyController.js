const db = require("../config/db");

/* ---------------- HELPERS ---------------- */

const isEmpty = (val) => !val || val.toString().trim() === "";

/* ---------------- GET SOCIETIES ---------------- */

// const getSocieties = async (req, res) => {
//   try {
//     const search = String(req.query.search || "").trim();

//     let sql = "SELECT * FROM societies WHERE 1=1";
//     const params = [];

//     if (search) {
//       sql += ` AND (
//         LOWER(society_name) LIKE LOWER(?) OR 
//         LOWER(address) LIKE LOWER(?) OR
//         LOWER(city) LIKE LOWER(?)
//       )`;
//       params.push(`%${search}%`, `%${search}%`, `%${search}%`);
//     }

//     sql += " ORDER BY society_id DESC";

//     const [rows] = await db.query(sql, params);
//     res.json(rows);
//   } catch (err) {
//     console.error("GET SOCIETIES ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


const getSocieties = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    let sql = "SELECT * FROM societies WHERE is_active = 1"; // ✅ FIX
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

  } catch (err) {
    console.error("GET SOCIETIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
/* ---------------- CREATE SOCIETY ---------------- */

const createSociety = async (req, res) => {
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
    } = req.body;

    if (isEmpty(society_name))
      return res.status(400).json({ error: "Society name required" });

    if (isEmpty(city))
      return res.status(400).json({ error: "City required" });

    if (isEmpty(contact_number))
      return res.status(400).json({ error: "Contact number required" });

    const [result] = await db.query(
      `INSERT INTO societies (
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
        longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        society_name,
        city,
        state || null,
        country || "India",
        pincode || null,
        contact_email || null,
        contact_number,
        address || null,
        google_map_url || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
      ]
    );

    res.json({
      message: "Society created successfully",
      society_id: result.insertId,
    });

  } catch (err) {
    console.error("CREATE SOCIETY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- UPDATE SOCIETY ---------------- */

const updateSociety = async (req, res) => {
  try {
    const { id } = req.params;

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
    } = req.body;

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
      WHERE society_id = ?`,
      [
        society_name,
        city,
        state,
        country,
        pincode,
        contact_email,
        contact_number,
        address,
        google_map_url,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        id,
      ]
    );

    res.json({ message: "Society updated successfully" });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- DELETE SOCIETY (SAFE) ---------------- */

const deleteSociety = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ soft delete recommended
    await db.query(
      `UPDATE societies SET is_active = 0 WHERE society_id = ?`,
      [id]
    );

    res.json({ message: "Society deactivated successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- CREATE TOWERS ---------------- */

const createTowers = async (req, res) => {
  const { society_id, towers } = req.body;

  if (!society_id || !Array.isArray(towers) || !towers.length)
    return res.status(400).json({ error: "Invalid data" });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔥 delete old towers + related data
    await connection.query(`
      DELETE fl FROM flats fl
      JOIN floors f ON fl.floor_id = f.floor_id
      JOIN towers t ON f.tower_id = t.tower_id
      WHERE t.society_id = ?
    `, [society_id]);

    await connection.query(`
      DELETE f FROM floors f
      JOIN towers t ON f.tower_id = t.tower_id
      WHERE t.society_id = ?
    `, [society_id]);

    await connection.query(
      "DELETE FROM towers WHERE society_id = ?",
      [society_id]
    );

    const values = towers.map((t) => [society_id, t.trim()]);

    await connection.query(
      "INSERT INTO towers (society_id, tower_name) VALUES ?",
      [values]
    );

    const [rows] = await connection.query(
      "SELECT tower_id, tower_name FROM towers WHERE society_id = ?",
      [society_id]
    );

    await connection.commit();
    res.json(rows);

  } catch (err) {
    await connection.rollback();
    console.error("CREATE TOWERS ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/* ---------------- GET TOWERS ---------------- */

const getTowersBySociety = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT tower_id, tower_name FROM towers WHERE society_id = ?",
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET TOWERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- GENERATE UNITS ---------------- */

const generateUnits = async (req, res) => {
  const { configs } = req.body;

  if (!Array.isArray(configs))
    return res.status(400).json({ error: "Invalid configs" });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const c of configs) {
      const { tower_id, total_floors, units_per_floor } = c;

      // 🔥 clear old data
      await connection.query(`
        DELETE fl FROM flats fl
        JOIN floors f ON fl.floor_id = f.floor_id
        WHERE f.tower_id = ?
      `, [tower_id]);

      await connection.query(
        "DELETE FROM floors WHERE tower_id = ?",
        [tower_id]
      );

      for (let floor = 1; floor <= total_floors; floor++) {
        const [floorRes] = await connection.query(
          "INSERT INTO floors (tower_id, floor_number) VALUES (?, ?)",
          [tower_id, floor]
        );

        const floor_id = floorRes.insertId;

        const flats = [];

        for (let unit = 1; unit <= units_per_floor; unit++) {
          const flatNumber = `${floor}${unit
            .toString()
            .padStart(2, "0")}`;

          flats.push([floor_id, flatNumber]);
        }

        await connection.query(
          "INSERT INTO flats (floor_id, flat_number) VALUES ?",
          [flats]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Units generated successfully" });

  } catch (err) {
    await connection.rollback();
    console.error("UNITS ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/* ---------------- GET CONFIGS ---------------- */

const getTowerConfigs = async (req, res) => {
  try {
    const { id } = req.params;

    // Get tower configs as before
    const [rows] = await db.query(`
      SELECT 
        t.tower_id,
        t.tower_name,
        COUNT(DISTINCT f.floor_id) AS total_floors,
        CASE 
          WHEN COUNT(DISTINCT f.floor_id) = 0 THEN 0
          ELSE FLOOR(COUNT(fl.flat_id) / COUNT(DISTINCT f.floor_id))
        END AS units_per_floor
      FROM towers t
      LEFT JOIN floors f ON f.tower_id = t.tower_id
      LEFT JOIN flats fl ON fl.floor_id = f.floor_id
      WHERE t.society_id = ?
      GROUP BY t.tower_id
    `, [id]);

    // For each tower, get the list of flat numbers
    for (const row of rows) {
      const [units] = await db.query(
        `SELECT fl.flat_number FROM flats fl
         JOIN floors f ON fl.floor_id = f.floor_id
         WHERE f.tower_id = ?
         ORDER BY fl.flat_number ASC`,
        [row.tower_id]
      );
      row.units = units.map(u => u.flat_number);
    }

    res.json(rows);
  } catch (err) {
    console.error("CONFIG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- EXPORT ---------------- */

module.exports = {
  getSocieties,
  createSociety,
  updateSociety,
  deleteSociety,
  createTowers,
  getTowersBySociety,
  generateUnits,
  getTowerConfigs,
};