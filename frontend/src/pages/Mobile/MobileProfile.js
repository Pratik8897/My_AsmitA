import MobileLayout from "./MobileLayout";
import Button from "../../components/ui/Button";
import { getStoredAuthUser, logout } from "../../services/authService";

const Field = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
    <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
      {label}
    </div>
    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
      {value || "-"}
    </div>
  </div>
);

const MobileProfile = () => {
  const user = getStoredAuthUser();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/m";
  };

  return (
    <MobileLayout title="Profile">
      <div className="space-y-4">
        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <div className="text-sm font-semibold">
            {user?.full_name || user?.name || "User"}
          </div>
          <div className="mt-1 text-xs opacity-90">
            {user?.user_type || user?.role || "-"}
          </div>
        </div>

        <div className="grid gap-2">
          <Field label="User ID" value={user?.user_id} />
          <Field label="Email" value={user?.email_id || user?.email} />
          <Field label="Mobile" value={user?.mobile_number} />
          <Field label="Society ID" value={user?.society_id} />
          <Field label="Account Type" value={user?.account_type} />
        </div>

        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </MobileLayout>
  );
};

export default MobileProfile;

