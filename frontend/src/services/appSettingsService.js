import api from "./api";

export const APP_SETTINGS_EVENT = "myasmita:settings-updated";
export const defaultRoleRestrictions = {
  canManageUsers: false,
  canManageSocieties: false,
  canApproveResidents: false,
  canManageBilling: false,
  canManageAmenities: false,
  canExportData: false,
};

export const defaultAppSettings = {
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

let settingsCache = null;

const normalizeRole = (role) => ({
  ...role,
  restrictions: {
    ...defaultRoleRestrictions,
    ...role.restrictions,
  },
});

const normalizeSettings = (settings = defaultAppSettings) => ({
  roles: [...(settings.roles || defaultAppSettings.roles)]
    .map(normalizeRole)
    .sort((a, b) => a.name.localeCompare(b.name)),
  restrictions: {
    ...defaultAppSettings.restrictions,
    ...settings.restrictions,
  },
});

const emitSettingsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(APP_SETTINGS_EVENT));
  }
};

export const getAppSettings = async () => {
  try {
    const res = await api.get("/settings");
    settingsCache = normalizeSettings(res.data);
    return settingsCache;
  } catch (error) {
    console.error("GET APP SETTINGS ERROR:", error);
    return settingsCache || normalizeSettings(defaultAppSettings);
  }
};

export const saveAppSettings = async (settings) => {
  const payload = normalizeSettings(settings);
  const res = await api.put("/settings", payload);
  settingsCache = normalizeSettings(res.data);
  emitSettingsUpdated();
  return settingsCache;
};

export const getRoleNames = async () => {
  try {
    const res = await api.get("/settings/roles");
    const roles = res.data.map(normalizeRole);
    settingsCache = {
      ...(settingsCache || normalizeSettings(defaultAppSettings)),
      roles,
    };
    return roles.map((role) => role.name);
  } catch (error) {
    console.error("GET ROLE NAMES ERROR:", error);
    return (settingsCache || normalizeSettings(defaultAppSettings)).roles.map(
      (role) => role.name
    );
  }
};

export const getDefaultRestrictions = () => ({
  ...defaultAppSettings.restrictions,
});
