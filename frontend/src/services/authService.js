import API from "./api";

const AUTH_STORAGE_KEY = "myasmita:auth-user";

export const normalizeRoleKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

export const getStoredAuthUser = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error("GET STORED AUTH USER ERROR:", error);
    return null;
  }
};

export const getCurrentRoleKey = () => {
  const user = getStoredAuthUser();
  return normalizeRoleKey(user?.user_type || user?.role || "");
};

export const isAuthenticated = () =>
  Boolean(localStorage.getItem("token") && getStoredAuthUser());

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const logout = async () => {
  const user = getStoredAuthUser();
  try {
    await API.post("/auth/logout", {
      user_id: user?.user_id,
      user_type: user?.user_type || user?.role,
    });
  } catch (error) {
    console.error("LOGOUT API ERROR:", error);
  } finally {
    clearAuthSession();
  }
};
