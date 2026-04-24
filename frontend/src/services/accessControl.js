import { defaultAppSettings } from "./appSettingsService";
import { getCurrentRoleKey, normalizeRoleKey } from "./authService";

const getRoleDefinition = (settings = defaultAppSettings) => {
  const currentRole = getCurrentRoleKey();

  return (settings.roles || []).find((role) => {
    const normalizedId = normalizeRoleKey(role.id);
    const normalizedName = normalizeRoleKey(role.name);

    return normalizedId === currentRole || normalizedName === currentRole;
  });
};

export const hasPermission = (permission, settings = defaultAppSettings) => {
  if (!permission) {
    return true;
  }

  return Boolean(getRoleDefinition(settings)?.restrictions?.[permission]);
};

export const hasRoleAccess = (allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const currentRole = getCurrentRoleKey();
  return allowedRoles
    .map((role) => normalizeRoleKey(role))
    .includes(currentRole);
};

export const canAccessItem = (item = {}, settings = defaultAppSettings) => {
  const checks = [];

  if (item.roles?.length) {
    checks.push(hasRoleAccess(item.roles));
  }

  if (item.permission) {
    checks.push(hasPermission(item.permission, settings));
  }

  if (checks.length === 0) {
    return true;
  }

  return checks.every(Boolean);
};
