import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MobileLayout from "./MobileLayout";
import Button from "../../components/ui/Button";
import API from "../../services/api";
import { setAuthSession } from "../../services/authService";

const QUICK_FILL = [
  { label: "Resident", email: "resident@test.com", password: "123456", society_id: 1 },
  { label: "Security Guard", email: "guard@test.com", password: "123456", society_id: "" },
  { label: "Super Admin", email: "superadmin@test.com", password: "123456", society_id: "" },
];

const normalizeRoleKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

const MobileHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    society_id: "",
  });

  const canSubmit = useMemo(
    () => Boolean(String(form.email || "").trim() && String(form.password || "").trim()),
    [form.email, form.password]
  );

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
        society_id: String(form.society_id || "").trim() ? Number(form.society_id) : undefined,
      });

      if (!res.data?.success) {
        toast.error("Login failed");
        return;
      }

      setAuthSession({ token: res.data.token, user: res.data.user });
      const role = normalizeRoleKey(res.data.user?.user_type || res.data.user?.role || "");
      toast.success("Login success");

      if (role === "security-guard") return navigate("/m/guard/home");
      return navigate("/m/resident/home");
    } catch (error) {
      console.error("MOBILE QUICK LOGIN ERROR:", error);
      toast.error(error?.response?.data?.message || "User not available / invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Mobile Demo">
      <div className="space-y-3">
        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          Login like the real flow (email/password + optional society id). If user
          is not found or society doesn’t match, login fails.
        </div>

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Login
          </div>
          <div className="grid gap-2">
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <input
              placeholder="Society ID (optional)"
              type="number"
              min={1}
              value={form.society_id}
              onChange={(e) => setForm((p) => ({ ...p, society_id: e.target.value }))}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <Button onClick={handleLogin} loading={loading} disabled={!canSubmit}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Quick fill (test)
          </div>
          <div className="grid gap-2">
            {QUICK_FILL.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                onClick={() =>
                  setForm({
                    email: item.email,
                    password: item.password,
                    society_id: item.society_id,
                  })
                }
                disabled={loading}
              >
                Fill {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
          Tip: If APIs fail, ensure backend is running and MySQL tables are
          created via `backend/sql/2026_05_11_pre_approved_invites.sql`.
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileHome;
