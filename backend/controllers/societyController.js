const db = require("../config/db");

/* ---------------- HELPERS ---------------- */

const isEmpty = (val) => !val || val.toString().trim() === "";

/* ---------------- GET SOCIETIES ---------------- */

const getSocieties = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    let sql = "SELECT * FROM societies WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (LOWER(society_name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`);
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
    const { society_name, city, contact_number } = req.body;

    if (isEmpty(society_name))
      return res.status(400).json({ error: "Society name required" });

    if (isEmpty(city))
      return res.status(400).json({ error: "City required" });

    if (isEmpty(contact_number))
      return res.status(400).json({ error: "Contact number required" });

    const [result] = await db.query(
      `INSERT INTO societies (society_name, city, contact_number)
       VALUES (?, ?, ?)`,
      [society_name, city, contact_number]
    );

    res.json({
      message: "Society created",
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
    const { society_name, city, contact_number } = req.body;

    await db.query(
      `UPDATE societies SET 
        society_name = ?, 
        city = ?, 
        contact_number = ?
      WHERE society_id = ?`,
      [society_name, city, contact_number, id]
    );

    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- DELETE SOCIETY ---------------- */

const deleteSociety = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM societies WHERE society_id = ?`,
      [id]
    );

    res.json({ message: "Society deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- CREATE TOWERS ---------------- */

const createTowers = async (req, res) => {
  const { society_id, towers } = req.body;

  if (!society_id || !Array.isArray(towers))
    return res.status(400).json({ error: "Invalid data" });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 🔥 replace old towers (edit-safe)
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


const getTowerConfigs = async (req, res) => {
 try {
    const { id } = req.params; // society_id

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