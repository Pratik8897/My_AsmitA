import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { adminGateEntryLogs } from "../../services/inviteService";

const AdminGateEntryLogs = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    society_id: "",
    entry_type: "",
    entry_status: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGateEntryLogs({
        society_id: filters.society_id || undefined,
        entry_type: filters.entry_type || undefined,
        entry_status: filters.entry_status || undefined,
        limit: 200,
      });
      setRows(res.logs || []);
    } catch (error) {
      console.error("ADMIN GATE LOGS ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to load logs");
    } finally {
      setLoading(false);
    }
  }, [filters.entry_status, filters.entry_type, filters.society_id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout title="Gate Entry Logs">
      <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            placeholder="society_id"
            value={filters.society_id}
            onChange={(e) => setFilters((p) => ({ ...p, society_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="entry_type (guest/cab/delivery)"
            value={filters.entry_type}
            onChange={(e) => setFilters((p) => ({ ...p, entry_type: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="entry_status (checked_in/denied...)"
            value={filters.entry_status}
            onChange={(e) => setFilters((p) => ({ ...p, entry_status: e.target.value }))}
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
                <th className="px-3 py-2">Invite</th>
                <th className="px-3 py-2">Guest</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Visitor</th>
                <th className="px-3 py-2">Checked In</th>
                <th className="px-3 py-2">Checked Out</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((r) => (
                <tr key={r.id} className="text-gray-700 dark:text-gray-100">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.society_id}</td>
                  <td className="px-3 py-2">{r.invite_id || "-"}</td>
                  <td className="px-3 py-2">{r.invite_guest_id || "-"}</td>
                  <td className="px-3 py-2">{r.entry_type}</td>
                  <td className="px-3 py-2">{r.entry_status}</td>
                  <td className="px-3 py-2">
                    {r.visitor_name || "-"}
                    {r.mobile_number ? (
                      <div className="text-[11px] text-gray-500 dark:text-gray-300">
                        {r.mobile_number}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{r.checked_in_at || "-"}</td>
                  <td className="px-3 py-2">{r.checked_out_at || "-"}</td>
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

export default AdminGateEntryLogs;

