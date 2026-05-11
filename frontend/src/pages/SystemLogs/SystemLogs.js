import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { getAuditLogs, getSystemLogs } from "../../services/systemLogsService";

const formatDateYyyyMmDd = (date) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const SystemLogs = () => {
  const [mode, setMode] = useState("audit"); // audit | raw

  const [lines, setLines] = useState(200);
  const [date, setDate] = useState(() => formatDateYyyyMmDd(new Date()));
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);

  const [filters, setFilters] = useState({
    user_id: "",
    module: "",
    action: "",
    status: "",
  });

  const logs = useMemo(() => payload?.logs || [], [payload]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      if (mode === "raw") {
        const res = await getSystemLogs({
          lines,
          date: date || undefined,
        });
        setPayload(res);
      } else {
        const res = await getAuditLogs({
          user_id: filters.user_id ? Number(filters.user_id) : undefined,
          module: filters.module || undefined,
          action: filters.action || undefined,
          status: filters.status || undefined,
          limit: 200,
        });
        setPayload(res);
      }
    } catch (error) {
      console.error("SYSTEM LOGS ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load system logs."
      );
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [date, filters, lines, mode]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <AdminLayout title={mode === "audit" ? "Audit Logs" : "System Logs"}>
      <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              Mode
            </div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="audit">Audit logs (filtered)</option>
              <option value="raw">Raw logs (JSONL)</option>
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              Date (raw logs)
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={mode !== "raw"}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              Lines (raw logs)
            </div>
            <input
              type="number"
              min={1}
              max={2000}
              value={lines}
              onChange={(e) => setLines(Number(e.target.value || 200))}
              disabled={mode !== "raw"}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-3">
            {mode === "audit" && (
              <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  placeholder="user_id"
                  value={filters.user_id}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, user_id: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <input
                  placeholder="module (AUTH/USER/SOCIETY...)"
                  value={filters.module}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, module: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <input
                  placeholder="action (LOGIN_SUCCESS...)"
                  value={filters.action}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, action: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <input
                  placeholder="status (SUCCESS/FAILED/ERROR)"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            <Button onClick={loadLogs} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-300">
              {mode === "raw"
                ? `File: ${payload?.file || "N/A"} | Entries: ${logs.length}`
                : `Entries: ${logs.length}`}
            </div>

            {logs.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                No logs found for the selected date.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-200">
                    <tr>
                      {mode === "raw" ? (
                        <>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Level</th>
                          <th className="px-3 py-2">Message</th>
                          <th className="px-3 py-2">Request</th>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Path</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Module</th>
                          <th className="px-3 py-2">Action</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">IP</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {mode === "raw"
                      ? logs
                          .slice()
                          .reverse()
                          .map((entry, idx) => (
                            <tr
                              key={`${entry.ts || "ts"}-${idx}`}
                              className="text-gray-700 dark:text-gray-100"
                            >
                              <td className="whitespace-nowrap px-3 py-2">
                                {entry.ts || "-"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {entry.level || "-"}
                              </td>
                              <td className="px-3 py-2">{entry.message || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {entry.requestId || "-"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {entry.userId ? `${entry.userId}` : "-"}{" "}
                                {entry.userType ? `(${entry.userType})` : ""}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {entry.statusCode ?? "-"}
                              </td>
                              <td className="px-3 py-2">{entry.path || "-"}</td>
                            </tr>
                          ))
                      : logs.map((entry) => (
                          <tr
                            key={entry.id}
                            className="text-gray-700 dark:text-gray-100"
                            title={`old_value: ${entry.old_value || ""}\nnew_value: ${
                              entry.new_value || ""
                            }`}
                          >
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.created_at || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.user_id ?? "-"}{" "}
                              {entry.user_name ? `- ${entry.user_name}` : ""}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.role || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.module || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.action || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {entry.description || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.status || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {entry.ip_address || "-"}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemLogs;
