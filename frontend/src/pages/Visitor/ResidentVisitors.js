import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import { toast } from "react-toastify";
import { getStoredAuthUser } from "../../services/authService";
import {
  approveVisitorEntry,
  getResidentVisitorRequests,
  rejectVisitorEntry,
} from "../../services/visitorService";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-gray-100 text-gray-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "-"}
  </span>
);

const VisitorCard = ({ row, onApprove, onReject, busy }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {row.visitor_name}{" "}
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
              {row.visitor_phone}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {row.visitor_type_name || "Type: -"}{" "}
            {row.purpose ? `• ${row.purpose}` : ""}
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            Tower: {row.tower_name || "-"} • Unit: {row.unit_number || "-"}{" "}
            {row.vehicle_number ? `• Vehicle: ${row.vehicle_number}` : ""}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Requested:{" "}
            {row.requested_at
              ? new Date(row.requested_at).toLocaleString()
              : "-"}
          </div>
          {row.status === "REJECTED" && row.rejection_reason ? (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              Rejection: {row.rejection_reason}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          {row.status === "PENDING" ? (
            <>
              <Button
                onClick={() => onApprove(row.id)}
                disabled={busy}
                className="px-3 py-1 text-xs"
              >
                Approve
              </Button>
              <Button
                onClick={() => onReject(row.id)}
                disabled={busy}
                className="px-3 py-1 text-xs"
              >
                Reject
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ResidentVisitors = () => {
  const authUser = getStoredAuthUser();
  const [residentUserId, setResidentUserId] = useState(
    Number(authUser?.user_id) || 1 // TEMP fallback
  );

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rows, setRows] = useState([]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pending = useMemo(
    () => rows.filter((r) => r.status === "PENDING"),
    [rows]
  );
  const history = useMemo(
    () => rows.filter((r) => r.status !== "PENDING"),
    [rows]
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResidentVisitorRequests({ residentUserId });
      setRows(data || []);
    } catch (error) {
      console.error("LOAD RESIDENT VISITORS ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to load requests");
    } finally {
      setLoading(false);
    }
  }, [residentUserId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveVisitorEntry(id, { residentUserId });
      toast.success("Approved");
      await loadPage();
    } catch (error) {
      console.error("APPROVE ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to approve");
    } finally {
      setActionId(null);
    }
  };

  const openReject = (id) => {
    setRejectingId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!String(rejectionReason || "").trim()) {
      return toast.error("Rejection reason required");
    }

    setActionId(rejectingId);
    try {
      await rejectVisitorEntry(rejectingId, {
        residentUserId,
        rejectionReason,
      });
      toast.success("Rejected");
      setRejectModalOpen(false);
      setRejectingId(null);
      await loadPage();
    } catch (error) {
      console.error("REJECT ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to reject");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout title="Resident Visitors">
      <div className="p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Visitor Requests (Resident)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Temp testing: Resident User ID uses logged-in `user_id` if present (else 1).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Resident User ID
            </label>
            <input
              className="w-28 rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={residentUserId}
              onChange={(e) => setResidentUserId(Number(e.target.value || 1))}
              type="number"
              min={1}
            />
            <Button className="px-3 py-1 text-xs" onClick={loadPage}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Pending
              </h2>
              {pending.length === 0 ? (
                <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                  No pending requests.
                </div>
              ) : (
                <div className="grid gap-3">
                  {pending.map((row) => (
                    <VisitorCard
                      key={row.id}
                      row={row}
                      busy={actionId === row.id}
                      onApprove={handleApprove}
                      onReject={openReject}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                History
              </h2>
              {history.length === 0 ? (
                <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                  No history yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {history.map((row) => (
                    <VisitorCard
                      key={row.id}
                      row={row}
                      busy={false}
                      onApprove={() => {}}
                      onReject={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Visitor Request"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
              Reason
            </label>
            <textarea
              className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="px-3 py-1 text-xs"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="px-3 py-1 text-xs"
              disabled={actionId && actionId === rejectingId}
              onClick={handleReject}
            >
              {actionId && actionId === rejectingId ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default ResidentVisitors;

