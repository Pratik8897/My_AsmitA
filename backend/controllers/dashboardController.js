const db = require("../config/db");

const countRows = async (tableName, whereClause = "") => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM \`${tableName}\` ${whereClause}`
  );

  return Number(rows[0]?.total || 0);
};

const tableExists = async (tableName) => {
  const [rows] = await db.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );

  return rows.length > 0;
};

const getFirstExistingTable = async (tableNames = []) => {
  for (const tableName of tableNames) {
    if (await tableExists(tableName)) {
      return tableName;
    }
  }

  return null;
};

const getTimestampColumn = async (tableName) => {
  const candidates = [
    "created_at",
    "createdAt",
    "added_at",
    "addedAt",
    "updated_at",
    "updatedAt",
  ];

  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${candidates.map(() => "?").join(",")})
     ORDER BY FIELD(COLUMN_NAME, ${candidates.map(() => "?").join(",")})
     LIMIT 1`,
    [tableName, ...candidates, ...candidates]
  );

  return rows[0]?.COLUMN_NAME || null;
};

const getRecentCount = async (tableName) => {
  const timestampColumn = await getTimestampColumn(tableName);

  if (!timestampColumn) {
    return null;
  }

  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM \`${tableName}\`
     WHERE \`${timestampColumn}\` >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)`
  );

  return Number(rows[0]?.total || 0);
};

const formatMetric = (value) =>
  typeof value === "number" ? value : null;

exports.getDashboardStats = async (req, res) => {
  try {
    const usersTable = (await tableExists("users")) ? "users" : null;
    const societiesTable = (await tableExists("societies")) ? "societies" : null;
    const servicesTable = await getFirstExistingTable([
      "services",
      "service_providers",
      "services_providers",
      "service_used",
      "service_usage",
    ]);

    const [totalUsers, totalSocieties, totalServices] = await Promise.all([
      usersTable ? countRows(usersTable) : Promise.resolve(0),
      societiesTable ? countRows(societiesTable) : Promise.resolve(0),
      servicesTable ? countRows(servicesTable) : Promise.resolve(0),
    ]);

    const [newUsers, newSocieties, newServices] = await Promise.all([
      usersTable ? getRecentCount(usersTable) : Promise.resolve(null),
      societiesTable ? getRecentCount(societiesTable) : Promise.resolve(null),
      servicesTable ? getRecentCount(servicesTable) : Promise.resolve(null),
    ]);

    res.json({
      totals: {
        users: formatMetric(totalUsers),
        societies: formatMetric(totalSocieties),
        services: formatMetric(totalServices),
      },
      recent: {
        users: formatMetric(newUsers),
        societies: formatMetric(newSocieties),
        services: formatMetric(newServices),
      },
      sources: {
        users: usersTable,
        societies: societiesTable,
        services: servicesTable,
      },
    });
  } catch (error) {
    console.error("GET DASHBOARD STATS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
