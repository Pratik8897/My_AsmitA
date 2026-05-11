import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { cancelPreApprovedInvite, getMyPreApprovedInvites } from "../../services/inviteService";

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-800",
  used: "bg-blue-100 text-blue-800",
  expired: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  blocked: "bg-red-100 text-red-800",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      STATUS_STYLES[String(status || "").toLowerCase()] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "-"}
  </span>
);

const ResidentMyInvites = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [actionId, setActionId] = useState(null);

  const invites = useMemo(() => rows || [], [rows]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPreApprovedInvites();
      setRows(res.invites || []);
    } catch (error) {
      console.error("LOAD MY INVITES ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to load invites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleCancel = async (id) => {
    setActionId(id);
    try {
      await cancelPreApprovedInvite(id);
      toast.success("Invite cancelled");
      await loadPage();
    } catch (error) {
      console.error("CANCEL INVITE ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to cancel invite");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout title="My Invites">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-300">
          Pre-approved gate passes for guests / cabs / deliveries.
        </div>
        <Button onClick={() => navigate("/resident/invites/new")}>
          Create Invite
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Spinner />
        </div>
      ) : invites.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow dark:bg-gray-800 dark:text-gray-300">
          No invites yet.
        </div>
      ) : (
        <div className="overflow-auto rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Pass</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invites.map((row) => (
                <tr key={row.id} className="text-gray-700 dark:text-gray-100">
                  <td className="px-4 py-3">
                    {row.invite_type} / {row.invite_sub_type}
                  </td>
                  <td className="px-4 py-3">{row.title || "-"}</td>
                  <td className="px-4 py-3">
                    {row.visitor_name || row.company_name || "-"}
                    {row.mobile_number ? (
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        {row.mobile_number}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.valid_from || "-"} → {row.valid_to || "-"}
                    <div className="text-gray-500 dark:text-gray-300">
                      {row.start_time || "-"} → {row.end_time || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{row.pass_code || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="px-3 py-1 text-xs"
                        onClick={() => navigate(`/resident/invites/${row.id}`)}
                      >
                        View
                      </Button>
                      {String(row.status || "").toLowerCase() === "active" ? (
                        <Button
                          variant="danger"
                          className="px-3 py-1 text-xs"
                          disabled={actionId === row.id}
                          onClick={() => handleCancel(row.id)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default ResidentMyInvites;

