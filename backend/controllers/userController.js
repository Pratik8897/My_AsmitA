const db = require("../config/db");
const { writeAuditLog } = require("../utils/auditLogger");
const { createPasswordResetToken } = require("../utils/passwordReset");
const { sendMail } = require("../utils/mailer");
const mobileNumberPattern = /^\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    await db.query(`ALTER TABLE users ADD COLUMN society_id INT NULL`);
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

const normalizeMobileNumber = (value = "") =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

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

exports.getUsers = async (req, res) => {
  try {
    await ensureSocietyIdColumn();

    const societyId = req.query.societyId ? Number(req.query.societyId) : null;

    const [rows] = await db.query(
      `SELECT *
       FROM users
       WHERE COALESCE(is_active, 1) = 1
         AND (? IS NULL OR society_id = ?)
       ORDER BY user_id DESC`,
      [societyId, societyId]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserFlatMappings = async (req, res) => {
  try {
    await ensureUserFlatMappingTable();

    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    const [rows] = await db.query(
      `SELECT mapping_id, user_id, flat_id, ownership_type
       FROM user_flat_mapping
       WHERE user_id = ?
       ORDER BY mapping_id ASC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET USER FLAT MAPPINGS ERROR:", err);
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
      account_type,
      user_type,
      os_type,
      password_hash,
      society_id,
      flat_mappings,
    } = req.body;

    const normalizedEmail = String(email_id || "").trim().toLowerCase();
    const normalizedMobile = normalizeMobileNumber(mobile_number);

    if (!full_name?.trim()) {
      return res.status(400).json({
        error: "Full name is required.",
        field: "full_name",
      });
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
        field: "email_id",
      });
    }

    if (!mobileNumberPattern.test(normalizedMobile)) {
      return res.status(400).json({
        error: "Mobile number must be exactly 10 digits.",
        field: "mobile_number",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id: normalizedEmail,
      mobile_number: normalizedMobile,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === normalizedEmail
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

    await ensureSocietyIdColumn();
    await ensureUserFlatMappingTable();

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email_id, mobile_number, gender, account_type, user_type, os_type, password_hash, society_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        normalizedEmail,
        normalizedMobile,
        gender,
        account_type || "app",
        user_type,
        os_type,
        password_hash,
        society_id ? Number(society_id) : null,
      ]
    );

    const userId = result.insertId;

    if (Array.isArray(flat_mappings) && flat_mappings.length) {
      const mappings = flat_mappings
        .map((m) => ({
          flat_id: Number(m?.flat_id),
          ownership_type: m?.ownership_type === "Tenant" ? "Tenant" : "Owner",
        }))
        .filter((m) => Number.isInteger(m.flat_id) && m.flat_id > 0);

      if (mappings.length) {
        const values = mappings.map((m) => [userId, m.flat_id, m.ownership_type]);
        await db.query(
          "INSERT INTO user_flat_mapping (user_id, flat_id, ownership_type) VALUES ?",
          [values]
        );
      }
    }

    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_CREATED",
      description: "User created",
      status: "SUCCESS",
      new_value: {
        user_id: userId,
        full_name,
        email_id: normalizedEmail,
        mobile_number: normalizedMobile,
        user_type,
        society_id: society_id ? Number(society_id) : null,
        flat_mappings: Array.isArray(flat_mappings) ? flat_mappings : undefined,
      },
    });

    // Send password reset/setup email (best-effort)
    if (normalizedEmail) {
      try {
        const { rawToken, expiresAt } = await createPasswordResetToken(
          userId,
          Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60)
        );

        const appBaseUrl =
          process.env.FRONTEND_BASE_URL || "http://localhost:3000";
        const resetLink = `${appBaseUrl}/reset-password?token=${rawToken}&user_id=${userId}`;

        await sendMail({
          to: normalizedEmail,
          subject: "Set your password",
          text: `Welcome! Set your password using this link (expires at ${expiresAt.toISOString()}): ${resetLink}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.4">
              <h2>Welcome to my AsmitA</h2>
              <p>Your account has been created. Click below to set your password.</p>
              <p><a href="${resetLink}">Set Password</a></p>
              <p style="color:#666;font-size:12px">This link expires at ${expiresAt.toISOString()}.</p>
            </div>
          `,
        });

        void writeAuditLog({
          req,
          module: "AUTH",
          action: "PASSWORD_RESET_EMAIL_SENT",
          description: "Password reset email sent on user creation",
          status: "SUCCESS",
          new_value: { user_id: userId, email: normalizedEmail },
        });
      } catch (error) {
        console.error("SEND RESET EMAIL ERROR:", error);
        void writeAuditLog({
          req,
          module: "AUTH",
          action: "PASSWORD_RESET_EMAIL_SENT",
          description: "Password reset email failed on user creation",
          status: "ERROR",
          new_value: { user_id: userId, email: normalizedEmail, error: error?.message },
        });
      }
    }

    res.status(201).json({
      message: "User created successfully",
      userId,
    });
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_CREATED",
      description: "User create failed",
      status: "ERROR",
      new_value: req.body,
    });
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
      account_type,
      user_type,
      os_type,
      password_hash,
      society_id,
      flat_mappings,
    } = req.body;

    const normalizedEmail = String(email_id || "").trim().toLowerCase();
    const normalizedMobile = normalizeMobileNumber(mobile_number);

    if (!full_name?.trim()) {
      return res.status(400).json({
        error: "Full name is required.",
        field: "full_name",
      });
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
        field: "email_id",
      });
    }

    if (!mobileNumberPattern.test(normalizedMobile)) {
      return res.status(400).json({
        error: "Mobile number must be exactly 10 digits.",
        field: "mobile_number",
      });
    }

    const duplicateUser = await findDuplicateUser({
      email_id: normalizedEmail,
      mobile_number: normalizedMobile,
      excludeUserId: id,
    });

    if (duplicateUser) {
      const duplicateField =
        duplicateUser.email_id?.toLowerCase() === normalizedEmail
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

    await ensureSocietyIdColumn();
    await ensureUserFlatMappingTable();

    const [oldUserRows] = await db.query(
      "SELECT * FROM users WHERE user_id = ? LIMIT 1",
      [id]
    );
    const oldUser = oldUserRows[0] || null;

    const [oldMappingRows] = await db.query(
      `SELECT mapping_id, user_id, flat_id, ownership_type
       FROM user_flat_mapping
       WHERE user_id = ?
       ORDER BY mapping_id ASC`,
      [id]
    );

    if (password_hash) {
      await db.query(
        `UPDATE users
         SET full_name = ?, email_id = ?, mobile_number = ?, gender = ?, account_type = ?, user_type = ?, os_type = ?, password_hash = ?, society_id = ?
         WHERE user_id = ?`,
        [
          full_name,
          normalizedEmail,
          normalizedMobile,
          gender,
          account_type || "app",
          user_type,
          os_type,
          password_hash,
          society_id ? Number(society_id) : null,
          id,
        ]
      );
    } else {
      await db.query(
        `UPDATE users
         SET full_name = ?, email_id = ?, mobile_number = ?, gender = ?, account_type = ?, user_type = ?, os_type = ?, society_id = ?
         WHERE user_id = ?`,
        [
          full_name,
          normalizedEmail,
          normalizedMobile,
          gender,
          account_type || "app",
          user_type,
          os_type,
          society_id ? Number(society_id) : null,
          id,
        ]
      );
    }

    if (Array.isArray(flat_mappings)) {
      await db.query("DELETE FROM user_flat_mapping WHERE user_id = ?", [id]);

      const mappings = flat_mappings
        .map((m) => ({
          flat_id: Number(m?.flat_id),
          ownership_type: m?.ownership_type === "Tenant" ? "Tenant" : "Owner",
        }))
        .filter((m) => Number.isInteger(m.flat_id) && m.flat_id > 0);

      if (mappings.length) {
        const values = mappings.map((m) => [Number(id), m.flat_id, m.ownership_type]);
        await db.query(
          "INSERT INTO user_flat_mapping (user_id, flat_id, ownership_type) VALUES ?",
          [values]
        );
      }
    }

    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_UPDATED",
      description: "User profile updated",
      status: "SUCCESS",
      old_value: { user: oldUser, flat_mappings: oldMappingRows },
      new_value: {
        user_id: Number(id),
        full_name,
        email_id: normalizedEmail,
        mobile_number: normalizedMobile,
        gender,
        account_type: account_type || "app",
        user_type,
        os_type,
        society_id: society_id ? Number(society_id) : null,
        flat_mappings: Array.isArray(flat_mappings) ? flat_mappings : undefined,
      },
    });

    if (oldUser && String(oldUser.user_type || "") !== String(user_type || "")) {
      void writeAuditLog({
        req,
        module: "USER",
        action: "USER_ROLE_CHANGED",
        description: "User role changed",
        status: "SUCCESS",
        old_value: { user_id: Number(id), user_type: oldUser.user_type },
        new_value: { user_id: Number(id), user_type },
      });
    }

    res.json({ message: "User updated" });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_UPDATED",
      description: "User update failed",
      status: "ERROR",
      new_value: { user_id: req.params.id, ...req.body },
    });
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [oldUserRows] = await db.query(
      "SELECT * FROM users WHERE user_id = ? LIMIT 1",
      [id]
    );
    const oldUser = oldUserRows[0] || null;

    await db.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?",
      [id]
    );

    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_DELETED",
      description: "User deleted (deactivated)",
      status: "SUCCESS",
      old_value: oldUser,
      new_value: { user_id: Number(id), is_active: 0 },
    });

    res.json({ message: "User deactivated" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    void writeAuditLog({
      req,
      module: "USER",
      action: "USER_DELETED",
      description: "User delete failed",
      status: "ERROR",
      new_value: { user_id: req.params.id },
    });
    res.status(500).json({ error: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const [[total]] = await db.query(
      "SELECT COUNT(*) as total FROM users"
    );

    const [[active]] = await db.query(
      "SELECT COUNT(*) as active FROM users WHERE COALESCE(is_active, 1) = 1"
    );

    const [[inactive]] = await db.query(
      "SELECT COUNT(*) as inactive FROM users WHERE COALESCE(is_active, 1) = 0"
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
