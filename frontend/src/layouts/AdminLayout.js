import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { menuItems } from "../config/menu";
import {
  APP_SETTINGS_EVENT,
  defaultAppSettings,
  getAppSettings,
} from "../services/appSettingsService";
import { canAccessItem } from "../services/accessControl";
import { getStoredAuthUser, logout } from "../services/authService";

const AdminLayout = ({ title, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [authUser, setAuthUser] = useState(getStoredAuthUser());
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadSettings = async () => {
      const nextSettings = await getAppSettings();
      setSettings(nextSettings);
      setAuthUser(getStoredAuthUser());
      setSettingsLoading(false);
    };

    loadSettings();
    window.addEventListener(APP_SETTINGS_EVENT, loadSettings);

    return () => {
      window.removeEventListener(APP_SETTINGS_EVENT, loadSettings);
    };
  }, []);

  const buildVisibleMenu = (items) => {
    const visible = [];

    for (const item of items) {
      const children = Array.isArray(item.children)
        ? buildVisibleMenu(item.children)
        : null;

      const canSeeSelf = canAccessItem(item, settings || defaultAppSettings);
      const canSeeChildren = children && children.length > 0;

      if (canSeeSelf || canSeeChildren) {
        visible.push({ ...item, children: children || undefined });
      }
    }

    return visible;
  };

  const visibleMenuItems = settingsLoading ? [] : buildVisibleMenu(menuItems);

  const isGroupActive = (item) => {
    if (!item?.children?.length) return false;
    return item.children.some(
      (child) =>
        child.path === location.pathname ||
        (child.children?.length ? isGroupActive(child) : false)
    );
  };

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full bg-white p-4 shadow-md transition-all duration-300 dark:bg-gray-800 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-20" : "w-64"} md:translate-x-0`}
      >
        <div className="mb-6 flex items-center gap-2">
          <img src="/logo192.png" alt="logo" className="w-8" />
          {!isCollapsed && (
            <span className="font-bold text-gray-800 dark:text-white">
              my AsmitA
            </span>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {settingsLoading ? (
            !isCollapsed && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading permissions...
              </div>
            )
          ) : (
            visibleMenuItems.map((item) => {
              const Icon = item.icon;

              const groupActive = isGroupActive(item);
              const groupOpen =
                openGroups[item.label] ?? (groupActive ? true : false);

              if (item.children?.length && !isCollapsed) {
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.label)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                        groupActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 min-w-[20px]" />}
                        <span>{item.label}</span>
                      </span>
                      <span className="text-xs opacity-70">
                        {groupOpen ? "▾" : "▸"}
                      </span>
                    </button>

                    {groupOpen && (
                      <div className="mt-1 flex flex-col gap-1 pl-6">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                                  isActive
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`
                              }
                            >
                              {ChildIcon && (
                                <ChildIcon className="h-4 w-4 min-w-[16px]" />
                              )}
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  {Icon && <Icon className="h-5 w-5 min-w-[20px]" />}
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })
          )}
        </nav>
      </aside>

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-gray-800 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-xl text-gray-700 dark:text-white md:hidden"
            >
              ☰
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden text-xl text-gray-700 dark:text-white md:block"
            >
              ☰
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex min-w-[72px] items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 md:text-sm"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <div className="flex items-center gap-2">
              <img
                src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39"
                className="h-8 w-8 rounded-full"
                alt=""
              />
              <div className="hidden sm:block">
                <div className="text-sm text-gray-700 dark:text-white">
                  {authUser?.full_name || authUser?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  {authUser?.user_type || authUser?.role || "Role unavailable"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {title && (
            <h1 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white md:text-xl">
              {title}
            </h1>
          )}
          {children}
        </main>

        <footer className="bg-white py-3 text-center text-xs text-gray-500 dark:bg-gray-800 md:text-sm">
          © 2026 myAsmitA
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
