import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { adminListInvites } from "../../services/inviteService";

const AdminInvites = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    society_id: "",
    invite_type: "",
    status: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListInvites({
        society_id: filters.society_id || undefined,
        invite_type: filters.invite_type || undefined,
        status: filters.status || undefined,
        limit: 200,
      });
      setRows(res.invites || []);
    } catch (error) {
      console.error("ADMIN INVITES ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to load invites");
    } finally {
      setLoading(false);
    }
  }, [filters.invite_type, filters.society_id, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout title="All Pre-Approved Invites">
      <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            placeholder="society_id"
            value={filters.society_id}
            onChange={(e) => setFilters((p) => ({ ...p, society_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="invite_type (guest/cab/delivery)"
            value={filters.invite_type}
            onChange={(e) => setFilters((p) => ({ ...p, invite_type: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="status (active/used/cancelled...)"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <div className="flex items-end gap-2">
            <Button onClick={load}>Refresh</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-200">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Society</th>
                <th className="px-3 py-2">Tower</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Resident</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((r) => (
                <tr key={r.id} className="text-gray-700 dark:text-gray-100">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.society_id}</td>
                  <td className="px-3 py-2">{r.tower_id || "-"}</td>
                  <td className="px-3 py-2">{r.unit_id || "-"}</td>
                  <td className="px-3 py-2">{r.resident_id}</td>
                  <td className="px-3 py-2">
                    {r.invite_type}/{r.invite_sub_type}
                  </td>
                  <td className="px-3 py-2">{r.title || "-"}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.created_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInvites;

