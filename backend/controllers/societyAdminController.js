const db = require("../config/db");

const mobileNumberPattern = /^\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalize = (value = "") => String(value).trim();
const normalizeMobileNumber = (value = "") =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

const ensureSocietyIdColumn = async () => {
  const [rows] = await db.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'society_id'
     LIMIT 1`
  );

  if (rows.length === 0) {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN society_id INT NULL AFTER os_type
    `);
  }
};

const ensureSocietyIdIndex = async () => {
  const [rows] = await db.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND INDEX_NAME = 'idx_users_society_id'
     LIMIT 1`
  );

  if (rows.length === 0) {
    await db.query(`
      CREATE INDEX idx_users_society_id ON users (society_id)
    `);
  }
};

const ensureSocietyRelation = async () => {
  await ensureSocietyIdColumn();
  await ensureSocietyIdIndex();
};

const getConnection = async () => {
  await ensureSocietyRelation();
  return db;
};

const getSocietyById = async (societyId) => {
  const [rows] = await db.query(
    `SELECT society_id, society_name
     FROM societies
     WHERE society_id = ?
     LIMIT 1`,
    [societyId]
  );

  return rows[0] || null;
};

const getSocietyAdminById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.user_id,
            u.full_name,
            u.email_id,
            u.mobile_number,
            u.gender,
            u.account_type,
            u.user_type,
            u.os_type,
            u.password_hash,
            u.society_id,
            u.is_active,
            u.created_at,
            u.updated_at,
            s.society_name
     FROM users u
     LEFT JOIN societies s ON s.society_id = u.society_id
     WHERE u.user_id = ?
       AND u.user_type = 'Society Admin'
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findSocietyAdminBySocietyId = async (societyId, excludeUserId = null) => {
  const [rows] = await db.query(
    `SELECT user_id, society_id
     FROM users
     WHERE COALESCE(is_active, 1) = 1
       AND LOWER(user_type) = 'society admin'
       AND society_id = ?
       AND (? IS NULL OR user_id <> ?)
     LIMIT 1`,
    [societyId, excludeUserId, excludeUserId]
  );

  return rows[0] || null;
};

const findDuplicateUser = async ({
  email_id,
  mobile_number,
  excludeUserId = null,
}) => {
  const [rows] = await db.query(
    `SELECT user_id, email_id, mobile_number
     FROM users
     WHERE COALESCE(is_active, 1) = 1
       AND (LOWER(email_id) = LOWER(?) OR mobile_number = ?)
       AND (? IS NULL OR user_id <> ?)
     LIMIT 1`,
    [email_id, mobile_number, excludeUserId, excludeUserId]
  );

  return rows[0] || null;
};

exports.getSocietyAdmins = async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT u.user_id,
              u.full_name AS society_admin_name,
              u.email_id AS email,
              u.mobile_number AS phone,
              u.password_hash,
              u.society_id,
              u.user_type,
              u.account_type,
              u.is_active,
              u.created_at,
              u.updated_at,
              s.society_name
       FROM users u
       LEFT JOIN societies s ON s.society_id = u.society_id
       WHERE COALESCE(u.is_active, 1) = 1
         AND LOWER(u.user_type) = 'society admin'
       ORDER BY u.user_id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("GET SOCIETY ADMINS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createSocietyAdmin = async (req, res) => {
  const fullName = normalize(req.body.society_admin_name);
  const societyId = req.body.society_id ? Number(req.body.society_id) : null;
  const email = normalize(req.body.email).toLowerCase();
  const phone = normalizeMobileNumber(req.body.phone);
  const passwordHash = normalize(req.body.password_hash);

  if (!fullName || !societyId || !email || !phone || !passwordHash) {
    return res.status(400).json({
      error:
        "society_admin_name, society_id, email, phone, and password are required.",
    });
  }

  if (!mobileNumberPattern.test(phone)) {
    return res.status(400).json({
      error: "Phone number must be exactly 10 digits.",
      field: "phone",
    });
  }

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      error: "Please enter a valid email address.",
      field: "email",
    });
  }

  try {
    const society = await getSocietyById(societyId);
    if (!society) {
      return res.status(400).json({
        error: "Selected society does not exist.",
        field: "society_id",
      });
    }

    const existingSocietyAdmin = await findSocietyAdminBySocietyId(societyId);
    if (existingSocietyAdmin) {
      return res.status(409).json({
        error: "That society already has an active society admin.",
        field: "society_id",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id: email,
      mobile_number: phone,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === email ? "email" : "phone";

      return res.status(409).json({
        error:
          duplicateField === "email"
            ? "Email already exists"
            : "Phone already exists",
        field: duplicateField,
      });
    }

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email_id, mobile_number, gender, account_type, user_type, os_type, password_hash, society_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        fullName,
        email,
        phone,
        "Male",
        "management",
        "Society Admin",
        "Android",
        passwordHash,
        societyId,
      ]
    );

    res.status(201).json({
      message: "Society admin created successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error("CREATE SOCIETY ADMIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSocietyAdmin = async (req, res) => {
  const { id } = req.params;
  const fullName = normalize(req.body.society_admin_name);
  const societyId = req.body.society_id ? Number(req.body.society_id) : null;
  const email = normalize(req.body.email).toLowerCase();
  const phone = normalizeMobileNumber(req.body.phone);
  const passwordHash = normalize(req.body.password_hash);

  if (!fullName || !societyId || !email || !phone) {
    return res.status(400).json({
      error: "society_admin_name, society_id, email, and phone are required.",
    });
  }

  if (!mobileNumberPattern.test(phone)) {
    return res.status(400).json({
      error: "Phone number must be exactly 10 digits.",
      field: "phone",
    });
  }

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      error: "Please enter a valid email address.",
      field: "email",
    });
  }

  try {
    const society = await getSocietyById(societyId);
    if (!society) {
      return res.status(400).json({
        error: "Selected society does not exist.",
        field: "society_id",
      });
    }

    const currentAdmin = await getSocietyAdminById(id);

    if (!currentAdmin || Number(currentAdmin.is_active) !== 1) {
      return res.status(404).json({ error: "Society admin not found" });
    }

    const existingSocietyAdmin = await findSocietyAdminBySocietyId(
      societyId,
      Number(id)
    );

    if (existingSocietyAdmin) {
      return res.status(409).json({
        error: "That society already has an active society admin.",
        field: "society_id",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id: email,
      mobile_number: phone,
      excludeUserId: id,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === email ? "email" : "phone";

      return res.status(409).json({
        error:
          duplicateField === "email"
            ? "Email already exists"
            : "Phone already exists",
        field: duplicateField,
      });
    }

    if (passwordHash) {
      await db.query(
        `UPDATE users
         SET full_name = ?, email_id = ?, mobile_number = ?, gender = ?, account_type = ?, user_type = ?, os_type = ?, password_hash = ?, society_id = ?
         WHERE user_id = ?`,
        [
          fullName,
          email,
          phone,
          currentAdmin.gender || "Male",
          currentAdmin.account_type || "management",
          "Society Admin",
          currentAdmin.os_type || "Android",
          passwordHash,
          societyId,
          id,
        ]
      );
    } else {
      await db.query(
        `UPDATE users
         SET full_name = ?, email_id = ?, mobile_number = ?, gender = ?, account_type = ?, user_type = ?, os_type = ?, society_id = ?
         WHERE user_id = ?`,
        [
          fullName,
          email,
          phone,
          currentAdmin.gender || "Male",
          currentAdmin.account_type || "management",
          "Society Admin",
          currentAdmin.os_type || "Android",
          societyId,
          id,
        ]
      );
    }

    res.json({
      message: "Society admin updated successfully",
    });
  } catch (error) {
    console.error("UPDATE SOCIETY ADMIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSocietyAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const currentAdmin = await getSocietyAdminById(id);

    if (!currentAdmin) {
      return res.status(404).json({ error: "Society admin not found" });
    }

    await db.query(
      `UPDATE users
       SET is_active = 0
       WHERE user_id = ?`,
      [id]
    );

    res.json({ message: "Society admin deactivated successfully" });
  } catch (error) {
    console.error("DELETE SOCIETY ADMIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};