import React from "react";
import { NavLink } from "react-router-dom";
import { getCurrentRoleKey } from "../../services/authService";

const tabsForRole = (role) => {
  const normalized = String(role || "");

  if (normalized === "security-guard") {
    return [
      { label: "Home", to: "/m/guard/home" },
      { label: "Invites", to: "/m/guard/invites" },
      { label: "Visitors", to: "/guard/visitors" },
      { label: "Profile", to: "/m/profile" },
      { label: "More", to: "/m/more" },
    ];
  }

  return [
    { label: "Home", to: "/m/resident/home" },
    { label: "Invites", to: "/m/resident/invites" },
    { label: "Visitors", to: "/resident/visitors" },
    { label: "Profile", to: "/m/profile" },
    { label: "More", to: "/m/more" },
  ];
};

const MobileLayout = ({ title, children }) => {
  const role = getCurrentRoleKey();
  const tabs = tabsForRole(role);

  return (
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-950">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title || "Mobile Demo"}
            </div>
            <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            {children}
          </div>
          <div className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
            <nav className="grid grid-cols-5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `px-2 py-3 text-center text-[11px] font-medium ${
                      isActive
                        ? "text-blue-600 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
  
      </div>
    </div>
  );
};

export default MobileLayout;
