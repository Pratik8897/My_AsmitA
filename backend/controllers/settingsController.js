const db = require("../config/db");

const defaultRoleRestrictions = {
  canManageUsers: false,
  canManageSocieties: false,
  canApproveResidents: false,
  canManageBilling: false,
  canManageAmenities: false,
  canExportData: false,
};

const defaultSettings = {
  roles: [
    {
      id: "super-admin",
      name: "Super Admin",
      scope: "Platform",
      description: "Full platform access across all societies.",
      isSystem: true,
      restrictions: {
        canManageUsers: true,
        canManageSocieties: true,
        canApproveResidents: true,
        canManageBilling: true,
        canManageAmenities: true,
        canExportData: true,
      },
    },
    {
      id: "admin",
      name: "Admin",
      scope: "Platform",
      description: "Operational admin with access to core management tools.",
      isSystem: true,
      restrictions: {
        canManageUsers: true,
        canManageSocieties: true,
        canApproveResidents: true,
        canManageBilling: true,
        canManageAmenities: true,
        canExportData: true,
      },
    },
    {
      id: "society-admin",
      name: "Society Admin",
      scope: "Society",
      description: "Manages one society's residents, services, and settings.",
      isSystem: true,
      restrictions: {
        canManageUsers: true,
        canManageSocieties: true,
        canApproveResidents: true,
        canManageAmenities: true,
      },
    },
    {
      id: "user",
      name: "User",
      scope: "Resident",
      description: "Standard resident account for day-to-day usage.",
      isSystem: true,
      restrictions: {},
    },
    {
      id: "owner",
      name: "Owner",
      scope: "Resident",
      description: "Resident owner with ownership-specific access.",
      isSystem: true,
      restrictions: {},
    },
    {
      id: "tenant",
      name: "Tenant",
      scope: "Resident",
      description: "Resident tenant with tenant-specific access.",
      isSystem: true,
      restrictions: {},
    },
    {
      id: "society-manager",
      name: "Society Manager",
      scope: "Society",
      description: "Oversees daily society operations and escalations.",
      isSystem: true,
      restrictions: {
        canManageUsers: true,
        canApproveResidents: true,
        canManageAmenities: true,
      },
    },
    {
      id: "maintenance-staff",
      name: "Maintenance Staff",
      scope: "Operations",
      description: "Handles maintenance issues, tasks, and site visits.",
      isSystem: true,
      restrictions: {
        canManageAmenities: true,
      },
    },
    {
      id: "security-guard",
      name: "Security Guard",
      scope: "Operations",
      description: "Manages gate access, visitors, and security logs.",
      isSystem: true,
      restrictions: {},
    },
    {
      id: "accountant",
      name: "Accountant",
      scope: "Finance",
      description: "Manages billing, dues, and society accounts.",
      isSystem: true,
      restrictions: {
        canManageBilling: true,
        canExportData: true,
      },
    },
    {
      id: "help-desk",
      name: "Help Desk",
      scope: "Support",
      description: "Coordinates support tickets and resident communication.",
      isSystem: true,
      restrictions: {
        canApproveResidents: true,
      },
    },
  ],
  restrictions: {
    allowSelfRegistration: false,
    requireInviteForAdmins: true,
    restrictSocietyCreationToAdmins: true,
    requireApprovalForResidentAccounts: true,
    allowRoleEditingForSocietyAdmins: false,
    enableVisitorAndSecurityRoles: true,
  },
};

const cloneDefaultSettings = () =>
  JSON.parse(JSON.stringify(defaultSettings));

const normalizeRole = (role) => ({
  ...role,
  restrictions: {
    ...defaultRoleRestrictions,
    ...role.restrictions,
  },
});

const normalizeSettings = (settings = {}) => ({
  roles: [...(settings.roles || defaultSettings.roles)]
    .map(normalizeRole)
    .sort((a, b) => a.name.localeCompare(b.name)),
  restrictions: {
    ...defaultSettings.restrictions,
    ...settings.restrictions,
  },
});

const ensureSettingsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const seedDefaultSettings = async () => {
  const settings = cloneDefaultSettings();

  await db.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?), (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = setting_value`,
    [
      "roles",
      JSON.stringify(settings.roles),
      "restrictions",
      JSON.stringify(settings.restrictions),
    ]
  );
};

const loadSettings = async () => {
  await ensureSettingsTable();
  await seedDefaultSettings();

  const [rows] = await db.query(
    `SELECT setting_key, setting_value
     FROM app_settings
     WHERE setting_key IN ("roles", "restrictions")`
  );

  const settingsMap = rows.reduce((acc, row) => {
    try {
      acc[row.setting_key] = JSON.parse(row.setting_value);
    } catch (error) {
      acc[row.setting_key] =
        row.setting_key === "roles" ? defaultSettings.roles : defaultSettings.restrictions;
    }
    return acc;
  }, {});

  return normalizeSettings({
    roles: settingsMap.roles,
    restrictions: settingsMap.restrictions,
  });
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = normalizeSettings(req.body);

    await ensureSettingsTable();
    await db.query(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES (?, ?), (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [
        "roles",
        JSON.stringify(settings.roles),
        "restrictions",
        JSON.stringify(settings.restrictions),
      ]
    );

    res.json(settings);
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings.roles);
  } catch (error) {
    console.error("GET ROLES ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
