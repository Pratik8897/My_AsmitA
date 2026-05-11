import { NavLink } from "react-router-dom";
import MobileLayout from "./MobileLayout";
import { getCurrentRoleKey } from "../../services/authService";

const Item = ({ to, title, subtitle }) => (
  <NavLink
    to={to}
    className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
  >
    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
      {title}
    </div>
    {subtitle ? (
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {subtitle}
      </div>
    ) : null}
  </NavLink>
);

const MobileMore = () => {
  const role = getCurrentRoleKey();
  const isAdmin = ["admin", "super-admin"].includes(role);

  return (
    <MobileLayout title="More">
      <div className="space-y-2">
        <Item
          to="/m/profile"
          title="Profile"
          subtitle="View account details"
        />

        <Item
          to="/system-logs"
          title="Logs"
          subtitle="Audit logs + raw system logs"
        />

        {isAdmin ? (
          <>
            <Item
              to="/admin/pre-approved-invites"
              title="Admin • Invites"
              subtitle="All pre-approved invites"
            />
            <Item
              to="/admin/gate-entry-logs"
              title="Admin • Gate Entry Logs"
              subtitle="Allowed/Denied/Check-in/out history"
            />
            <Item
              to="/settings"
              title="Settings"
              subtitle="Roles, restrictions, exports"
            />
          </>
        ) : null}

        <Item
          to="/dashboard"
          title="Dashboard (Web)"
          subtitle="Open full admin layout"
        />
      </div>
    </MobileLayout>
  );
};

export default MobileMore;

