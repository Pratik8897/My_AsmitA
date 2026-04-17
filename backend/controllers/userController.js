const db = require("../config/db");
const mobileNumberPattern = /^\d{10}$/;

const findDuplicateUser = async ({
  email_id,
  mobile_number,
  excludeUserId = null,
}) => {
  const [rows] = await db.query(
    `SELECT user_id, email_id, mobile_number
     FROM users
     WHERE is_active = 1
       AND (LOWER(email_id) = LOWER(?) OR mobile_number = ?)
       AND (? IS NULL OR user_id <> ?)
     LIMIT 1`,
    [email_id, mobile_number, excludeUserId, excludeUserId]
  );

  return rows[0] || null;
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE is_active = 1"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      full_name,
      email_id,
      mobile_number,
      gender,
      user_type,
      os_type,
      password_hash,
    } = req.body;

    if (!mobileNumberPattern.test(String(mobile_number || ""))) {
      return res.status(400).json({
        error: "Mobile number must be exactly 10 digits.",
        field: "mobile_number",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id,
      mobile_number,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === email_id?.toLowerCase()
          ? "email_id"
          : "mobile_number";

      return res.status(409).json({
        error:
          duplicateField === "email_id"
            ? "Email already exists"
            : "Mobile number already exists",
        field: duplicateField,
      });
    }

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email_id, mobile_number, gender, user_type, os_type, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email_id,
        mobile_number,
        gender,
        user_type,
        os_type,
        password_hash,
      ]
    );

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email_id,
      mobile_number,
      gender,
      user_type,
      os_type,
    } = req.body;

    if (!mobileNumberPattern.test(String(mobile_number || ""))) {
      return res.status(400).json({
        error: "Mobile number must be exactly 10 digits.",
        field: "mobile_number",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id,
      mobile_number,
      excludeUserId: id,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === email_id?.toLowerCase()
          ? "email_id"
          : "mobile_number";

      return res.status(409).json({
        error:
          duplicateField === "email_id"
            ? "Email already exists"
            : "Mobile number already exists",
        field: duplicateField,
      });
    }

    await db.query(
      `UPDATE users
       SET full_name = ?, email_id = ?, mobile_number = ?, gender = ?, user_type = ?, os_type = ?
       WHERE user_id = ?`,
      [full_name, email_id, mobile_number, gender, user_type, os_type, id]
    );

    res.json({ message: "User updated" });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [id]
    );

    res.json({ message: "User deactivated" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const [[total]] = await db.query(
      "SELECT COUNT(*) as total FROM users"
    );

    const [[active]] = await db.query(
      "SELECT COUNT(*) as active FROM users WHERE is_active = 1"
    );

    const [[inactive]] = await db.query(
      "SELECT COUNT(*) as inactive FROM users WHERE is_active = 0"
    );

    res.json({
      total: total.total,
      active: active.active,
      inactive: inactive.inactive,
    });
  } catch (err) {
    console.error("GET USER STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
