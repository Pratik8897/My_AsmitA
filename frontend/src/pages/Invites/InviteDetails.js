import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { cancelPreApprovedInvite, getPreApprovedInviteById } from "../../services/inviteService";

const InviteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [guests, setGuests] = useState([]);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPreApprovedInviteById(id);
      setInvite(res.invite);
      setGuests(res.guests || []);
    } catch (error) {
      console.error("INVITE DETAILS ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to load invite");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelPreApprovedInvite(id);
      toast.success("Invite cancelled");
      await load();
    } catch (error) {
      console.error("CANCEL ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to cancel");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Invite Details">
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  if (!invite) {
    return (
      <AdminLayout title="Invite Details">
        <div className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow dark:bg-gray-800 dark:text-gray-300">
          Invite not found.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Invite Details">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {invite.title || "Invite"}{" "}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-300">
                  #{invite.id}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                {invite.invite_type} / {invite.invite_sub_type} • Status: {invite.status}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Visitor: {invite.visitor_name || invite.company_name || "-"}{" "}
                {invite.mobile_number ? `• ${invite.mobile_number}` : ""}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Valid: {invite.valid_from || "-"} → {invite.valid_to || "-"} • {invite.start_time || "-"} →{" "}
                {invite.end_time || "-"}
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
                Pass Code: <span className="font-mono">{invite.pass_code || "-"}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                QR Token: <span className="font-mono">{invite.qr_code || "-"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/resident/invites")}>
                Back
              </Button>
              {String(invite.status || "").toLowerCase() === "active" ? (
                <Button variant="danger" loading={cancelling} onClick={handleCancel}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {guests.length > 0 ? (
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Guests
            </div>
            <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-200">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Pass</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {guests.map((g) => (
                    <tr key={g.id} className="text-gray-700 dark:text-gray-100">
                      <td className="px-3 py-2">{g.guest_name || "-"}</td>
                      <td className="px-3 py-2">{g.mobile_number || "-"}</td>
                      <td className="px-3 py-2">{g.vehicle_number || "-"}</td>
                      <td className="px-3 py-2 font-mono">{g.pass_code || "-"}</td>
                      <td className="px-3 py-2">{g.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default InviteDetails;

