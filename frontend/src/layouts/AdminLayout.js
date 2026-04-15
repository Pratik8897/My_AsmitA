import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { menuItems } from "../config/menu";

const AdminLayout = ({ title, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const userRole = "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">

      {/* 🔥 Overlay (Mobile only) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🔥 Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-md transition-all duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${isCollapsed ? "w-20" : "w-64"} p-4`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/logo192.png" alt="logo" className="w-8" />
          {!isCollapsed && (
            <span className="font-bold text-gray-800 dark:text-white">
              my AsmitA
            </span>
          )}
        </div>

        {/* Menu */}
       
        <nav className="flex flex-col gap-1">
          {menuItems
            .filter((item) => item.roles?.includes(userRole))
            .map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)} // 🔥 close on click
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                >
                  {Icon && <Icon className="w-5 h-5 min-w-[20px]" />}
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
        </nav>

      </aside>
      

      {/* 🔥 Main */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300
        ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
      >

        {/* 🔥 Topbar */}
        <header className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 md:px-6 py-3 shadow-sm">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            
            {/* Mobile Menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-xl text-gray-700 dark:text-white"
            >
              ☰
            </button>

            {/* Desktop Collapse */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block text-xl text-gray-700 dark:text-white"
            >
              ☰
            </button>

          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 md:gap-4">

            {/* Theme */}
            <button
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="text-xs md:text-sm px-2 md:px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <img
                src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39"
                className="w-8 h-8 rounded-full"
                alt=""
              />
              <span className="text-sm text-gray-700 dark:text-white hidden sm:block">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* 🔥 Content */}
        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          {title && (
            <h1 className="text-lg md:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {title}
            </h1>
          )}
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs md:text-sm py-3 bg-white dark:bg-gray-800 text-gray-500">
          © 2026 myAsmitA
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;