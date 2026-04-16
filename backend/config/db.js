const mysql = require("mysql2/promise");

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter(
  (name) => !process.env[name]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing database environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error(
    "Create backend/.env with DB_HOST, DB_USER, DB_PASS, DB_NAME, and optional DB_PORT."
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Immediately check the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to the database.");
    connection.release(); // Always release the connection back to the pool!
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

module.exports = pool;
