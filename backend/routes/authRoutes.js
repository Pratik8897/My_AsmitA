const express = require("express");
const db = require("../config/db");
const { log } = require("../utils/logger");
const { writeAuditLog } = require("../utils/auditLogger");
const { createPasswordResetToken, verifyAndConsumeToken } = require("../utils/passwordReset");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password, society_id } = req.body;

  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    // TEMP sample logins for testing
    if (normalizedEmail === "superadmin@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 100,
          full_name: "Test Super Admin",
          email_id: "superadmin@test.com",
          account_type: "management",
          user_type: "super-admin",
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (normalizedEmail === "societyadmin@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 101,
          full_name: "Test Society Admin",
          email_id: "societyadmin@test.com",
          account_type: "management",
          user_type: "society-admin",
          society_id: 1,
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (normalizedEmail === "committee@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 102,
          full_name: "Test Committee Member",
          email_id: "committee@test.com",
          account_type: "management",
          user_type: "committee-member",
          society_id: 1,
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (normalizedEmail === "accountant@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 103,
          full_name: "Test Accountant",
          email_id: "accountant@test.com",
          account_type: "management",
          user_type: "accountant",
          society_id: 1,
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (normalizedEmail === "maintenance@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 104,
          full_name: "Test Maintenance Staff",
          email_id: "maintenance@test.com",
          account_type: "management",
          user_type: "maintenance-staff",
          society_id: 1,
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (normalizedEmail === "guard@test.com" && normalizedPassword === "123456") {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 1,
          full_name: "Test Guard",
          email_id: "guard@test.com",
          account_type: "app",
          user_type: "security-guard",
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (
      normalizedEmail === "resident@test.com" &&
      normalizedPassword === "123456"
    ) {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 2,
          full_name: "Test Resident",
          email_id: "resident@test.com",
          account_type: "app",
          user_type: "user",
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    if (
      normalizedEmail === "admin@test.com" &&
      normalizedPassword === "123456"
    ) {
      const payload = {
        success: true,
        token: "dummy_token",
        user: {
          user_id: 0,
          full_name: "Admin User",
          email_id: "admin@test.com",
          account_type: "management",
          user_type: "Admin",
        },
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    const requestedSocietyId =
      society_id !== undefined && society_id !== null && String(society_id).trim() !== ""
        ? Number(society_id)
        : null;

    const [rows] = await db.query(
      `SELECT user_id, full_name, email_id, mobile_number, account_type, user_type, society_id
       FROM users
       WHERE LOWER(email_id) = LOWER(?)
         AND password_hash = ?
         AND is_active = 1
         AND (? IS NULL OR society_id = ?)
       LIMIT 1`,
      [normalizedEmail, normalizedPassword, requestedSocietyId, requestedSocietyId]
    );

    if (rows.length > 0) {
      const payload = {
        success: true,
        token: "dummy_token",
        user: rows[0],
      };

      log("info", "user_login", {
        requestId: req.requestId,
        userId: payload.user.user_id,
        userType: payload.user.user_type,
        email: payload.user.email_id,
        ip: req.ip,
      });

      void writeAuditLog({
        req,
        module: "AUTH",
        action: "LOGIN_SUCCESS",
        description: "Login success",
        status: "SUCCESS",
        actor: {
          user_id: payload.user.user_id,
          user_name: payload.user.full_name,
          role: payload.user.user_type,
        },
        new_value: { email: payload.user.email_id },
      });

      return res.json(payload);
    }

    void writeAuditLog({
      req,
      module: "AUTH",
      action: "LOGIN_FAILED",
      description: "Login failed",
      status: "FAILED",
      new_value: { email: normalizedEmail },
    });

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    void writeAuditLog({
      req,
      module: "AUTH",
      action: "LOGIN_ERROR",
      description: "Login error",
      status: "ERROR",
      new_value: { email: String(email || "").trim().toLowerCase() },
    });
    return res.status(500).json({
      success: false,
      message: "Unable to login right now",
    });
  }
});

router.post("/logout", async (req, res) => {
  const userId =
    req.body?.user_id ?? req.headers["x-user-id"] ?? req.headers["x-userid"];
  const userType =
    req.body?.user_type ?? req.headers["x-user-type"] ?? req.headers["x-usertype"];

  log("info", "user_logout", {
    requestId: req.requestId,
    userId: userId != null ? Number(userId) : undefined,
    userType: userType ? String(userType) : undefined,
    ip: req.ip,
  });

  void writeAuditLog({
    req,
    module: "AUTH",
    action: "LOGOUT",
    description: "Logout",
    status: "SUCCESS",
    actor: {
      user_id: userId,
      role: userType,
    },
  });

  res.json({ success: true });
});

router.post("/request-password-reset", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const societyId =
    req.body?.society_id !== undefined && String(req.body?.society_id).trim() !== ""
      ? Number(req.body.society_id)
      : null;

  if (!email) return res.status(400).json({ success: false, message: "email is required" });

  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email_id
       FROM users
       WHERE LOWER(email_id) = LOWER(?)
         AND is_active = 1
         AND (? IS NULL OR society_id = ?)
       LIMIT 1`,
      [email, societyId, societyId]
    );

    const user = rows[0];

    // Always return success to avoid user enumeration.
    if (!user) {
      void writeAuditLog({
        req,
        module: "AUTH",
        action: "FORGOT_PASSWORD_REQUESTED",
        description: "Forgot password requested (email not found)",
        status: "FAILED",
        new_value: { email, society_id: societyId },
      });

      return res.json({ success: true, message: "If the user exists, an email will be sent" });
    }

    const { rawToken, expiresAt } = await createPasswordResetToken(
      user.user_id,
      Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60)
    );

    const appBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const resetLink = `${appBaseUrl}/reset-password?token=${rawToken}&user_id=${user.user_id}`;

    await sendMail({
      to: user.email_id,
      subject: "Reset your password",
      text: `Reset your password using this link (expires at ${expiresAt.toISOString()}): ${resetLink}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.4">
          <h2>Password reset</h2>
          <p>Click below to reset your password.</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p style="color:#666;font-size:12px">This link expires at ${expiresAt.toISOString()}.</p>
        </div>
      `,
    });

    void writeAuditLog({
      req,
      module: "AUTH",
      action: "FORGOT_PASSWORD_REQUESTED",
      description: "Forgot password requested",
      status: "SUCCESS",
      actor: { user_id: user.user_id, user_name: user.full_name },
      new_value: { user_id: user.user_id, email: user.email_id, society_id: societyId },
    });

    return res.json({ success: true, message: "If the user exists, an email will be sent" });
  } catch (error) {
    console.error("REQUEST PASSWORD RESET ERROR:", error);
    void writeAuditLog({
      req,
      module: "AUTH",
      action: "FORGOT_PASSWORD_REQUESTED",
      description: "Forgot password requested (error)",
      status: "ERROR",
      new_value: { email, society_id: societyId, error: error?.message },
    });
    return res.status(500).json({ success: false, message: "Unable to request password reset" });
  }
});

router.post("/reset-password", async (req, res) => {
  const userId = Number(req.body?.user_id);
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.new_password || "").trim();

  if (!userId) return res.status(400).json({ success: false, message: "user_id is required" });
  if (!token) return res.status(400).json({ success: false, message: "token is required" });
  if (!newPassword) return res.status(400).json({ success: false, message: "new_password is required" });

  try {
    const verify = await verifyAndConsumeToken({ userId, rawToken: token });
    if (!verify.ok) {
      void writeAuditLog({
        req,
        module: "AUTH",
        action: "PASSWORD_RESET_COMPLETED",
        description: "Password reset failed",
        status: "FAILED",
        new_value: { user_id: userId, reason: verify.reason },
      });
      return res.status(400).json({ success: false, message: verify.reason });
    }

    // NOTE: existing auth uses password_hash as plaintext. Keep consistent for now.
    await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [newPassword, userId]);

    void writeAuditLog({
      req,
      module: "AUTH",
      action: "PASSWORD_RESET_COMPLETED",
      description: "Password reset completed",
      status: "SUCCESS",
      new_value: { user_id: userId },
    });

    return res.json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    void writeAuditLog({
      req,
      module: "AUTH",
      action: "PASSWORD_RESET_COMPLETED",
      description: "Password reset error",
      status: "ERROR",
      new_value: { user_id: userId, error: error?.message },
    });
    return res.status(500).json({ success: false, message: "Unable to reset password" });
  }
});

module.exports = router;
