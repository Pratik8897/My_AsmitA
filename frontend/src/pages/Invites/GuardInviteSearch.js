import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import {
  gateInviteCheckIn,
  gateInviteCheckOut,
  gateInviteDeny,
  searchGateInvite,
} from "../../services/inviteService";

const GuardInviteSearch = () => {
  const [societyId, setSocietyId] = useState(() => {
    const cached = Number(localStorage.getItem("invite:test-society-id"));
    return Number.isFinite(cached) && cached > 0 ? String(cached) : "1";
  });
  const [gateId, setGateId] = useState("1");

  const [query, setQuery] = useState({ mobile: "", pass_code: "", qr_code: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const invite = result?.invite || null;
  const guest = result?.guest || null;

  const canAct = useMemo(() => Boolean(invite?.id), [invite]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem("invite:test-society-id", String(societyId || "1"));
      const res = await searchGateInvite({
        society_id: Number(societyId),
        mobile: query.mobile || undefined,
        pass_code: query.pass_code || undefined,
        qr_code: query.qr_code || undefined,
      });
      setResult(res);
      if (res.valid) toast.success("Invite valid");
      else toast.error(res.reason || "Invite not valid");
    } catch (error) {
      console.error("SEARCH INVITE ERROR:", error);
      setResult(null);
      toast.error(error?.response?.data?.message || "Invite not found");
    } finally {
      setLoading(false);
    }
  }, [query.mobile, query.pass_code, query.qr_code, societyId]);

  const actionPayload = () => ({
    society_id: Number(societyId),
    gate_id: Number(gateId || 1),
    invite_guest_id: guest?.id || undefined,
    pass_code: query.pass_code || undefined,
    qr_code: query.qr_code || undefined,
  });

  const handleCheckIn = async () => {
    if (!invite?.id) return;
    setBusy(true);
    try {
      await gateInviteCheckIn(invite.id, actionPayload());
      toast.success("Checked in");
      await handleSearch();
    } catch (error) {
      console.error("CHECKIN ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to check-in");
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!invite?.id) return;
    setBusy(true);
    try {
      await gateInviteCheckOut(invite.id, actionPayload());
      toast.success("Checked out");
      await handleSearch();
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to check-out");
    } finally {
      setBusy(false);
    }
  };

  const handleDeny = async () => {
    if (!invite?.id) return;
    const reason = window.prompt("Denial reason?", "Not allowed") || "Denied";
    setBusy(true);
    try {
      await gateInviteDeny(invite.id, { ...actionPayload(), denial_reason: reason });
      toast.success("Denied");
    } catch (error) {
      console.error("DENY ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to deny");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title="Gate Invite Search">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Society ID (temp)
              </div>
              <input
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                type="number"
                min={1}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Gate ID (temp)
              </div>
              <input
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                type="number"
                min={1}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Pass Code
              </div>
              <input
                value={query.pass_code}
                onChange={(e) => setQuery((p) => ({ ...p, pass_code: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="6-digit"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Mobile
              </div>
              <input
                value={query.mobile}
                onChange={(e) => setQuery((p) => ({ ...p, mobile: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="10-digit"
              />
            </div>
            <div className="md:col-span-3">
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                QR Token
              </div>
              <input
                value={query.qr_code}
                onChange={(e) => setQuery((p) => ({ ...p, qr_code: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="qr_xxx"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Spinner />
          </div>
        ) : result ? (
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {invite?.title || "Invite"}{" "}
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-300">
                    #{invite?.id}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {invite?.invite_type} / {invite?.invite_sub_type} • Status: {invite?.status}
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  Visitor: {guest?.guest_name || invite?.visitor_name || invite?.company_name || "-"}{" "}
                  {guest?.mobile_number || invite?.mobile_number ? `• ${guest?.mobile_number || invite?.mobile_number}` : ""}
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  Valid: {invite?.valid_from || "-"} → {invite?.valid_to || "-"} • {invite?.start_time || "-"} →{" "}
                  {invite?.end_time || "-"}
                </div>
                <div className="mt-2 text-xs">
                  {result.valid ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-green-800">Entry Allowed</span>
                  ) : (
                    <span className="rounded bg-red-100 px-2 py-1 text-red-800">
                      Deny: {result.reason || "Not valid"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled={!canAct || busy || !result.valid} onClick={handleCheckIn}>
                  Check-in
                </Button>
                <Button disabled={!canAct || busy} onClick={handleCheckOut} variant="outline">
                  Check-out
                </Button>
                <Button disabled={!canAct || busy} onClick={handleDeny} variant="danger">
                  Deny
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default GuardInviteSearch;

