const crypto = require("crypto");
const db = require("../config/db");
const { log } = require("./logger");

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const generateToken = () => crypto.randomBytes(32).toString("hex");

const ensurePasswordResetTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_prt_user (user_id),
      INDEX idx_prt_expires (expires_at),
      UNIQUE KEY uq_prt_token_hash (token_hash)
    )
  `);
};

const createPasswordResetToken = async (userId, ttlMinutes = 60) => {
  await ensurePasswordResetTable();

  const rawToken = generateToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + Number(ttlMinutes) * 60 * 1000);

  await db.query(
    `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
    `,
    [userId, tokenHash, expiresAt]
  );

  return { rawToken, tokenHash, expiresAt };
};

const verifyAndConsumeToken = async ({ userId, rawToken }) => {
  await ensurePasswordResetTable();
  const tokenHash = sha256(rawToken);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `
      SELECT id, expires_at, used_at
      FROM password_reset_tokens
      WHERE user_id = ?
        AND token_hash = ?
      LIMIT 1
      FOR UPDATE
      `,
      [userId, tokenHash]
    );

    const row = rows[0];
    if (!row) return { ok: false, reason: "Invalid token" };
    if (row.used_at) return { ok: false, reason: "Token already used" };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, reason: "Token expired" };
    }

    await conn.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
      [row.id]
    );

    await conn.commit();
    return { ok: true };
  } catch (error) {
    await conn.rollback();
    log("warn", "password_reset_consume_failed", {
      error: error?.message || String(error),
    });
    return { ok: false, reason: "Unable to verify token" };
  } finally {
    conn.release();
  }
};

module.exports = {
  createPasswordResetToken,
  verifyAndConsumeToken,
};

