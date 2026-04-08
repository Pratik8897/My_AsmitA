import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "home" },
  { label: "User Management", path: "/user-management", icon: "users" },
  { label: "Society Management", path: "/society-management", icon: "society" },
  { label: "Society Admin", path: "/society-admin", icon: "admin" },
  { label: "Services", path: "/services", icon: "services" },
  { label: "Services Providers", path: "/services-providers", icon: "providers" },
  { label: "Service Used", path: "/service-used", icon: "used" },
  { label: "Floor Summary", path: "/floor-summary", icon: "floor" },
  { label: "Ads", path: "/ads", icon: "ads" },
  { label: "Amenities", path: "/amenities", icon: "amenities" },
  { label: "Booking", path: "/booking", icon: "booking" },
  { label: "Parking Management", path: "/parking-management", icon: "parking" },
  { label: "Support", path: "/support", icon: "support" },
];

const AdminLayout = ({ title, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      return storedTheme;
    }
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    const handleResize = () => {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleMenuToggle = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setIsMobileOpen((prev) => !prev);
      return;
    }
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div
      className={`dashboard-page${isCollapsed ? " collapsed" : ""}${
        isMobileOpen ? " mobile-open" : ""
      }`}
    >
      <button
        type="button"
        className="dashboard-overlay"
        aria-label="Close menu"
        onClick={() => setIsMobileOpen(false)}
      />
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src="/logo192.png" alt="My Asmita" />
          <span>
            my <strong>AsmitA</strong>
          </span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <span className={`sidebar-icon ${item.icon}`} />
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="hamburger"
            type="button"
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
            aria-pressed={isCollapsed}
            onClick={handleMenuToggle}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="topbar-spacer" />

          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setTheme((prevTheme) =>
                prevTheme === "dark" ? "light" : "dark"
              )
            }
            aria-pressed={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="topbar-user">
            <img
              src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=80&q=80"
              alt="Admin avatar"
            />
            <span>Hi, Admin User!</span>
            <button className="topbar-icon" type="button" aria-label="Alerts">
              <span className="dot" />
            </button>
            <button className="topbar-icon" type="button" aria-label="Sign out">
              ⏻
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          {title ? (
            <div className="dashboard-title">
              <div className="home-icon" />
              <h1>{title}</h1>
            </div>
          ) : null}
          {children}
        </section>

        <footer className="dashboard-footer">
          <span>Copyright©2026 myAsmitA</span>
          <div className="footer-links">
            <NavLink to="/about-us">About Us</NavLink>
            <NavLink to="/contact-us">Contact Us</NavLink>
            <NavLink to="/terms-conditions">Terms &amp; Conditions</NavLink>
            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminLayout;

