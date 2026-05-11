import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import MobileLayout from "./MobileLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import {
  gateInviteCheckIn,
  gateInviteCheckOut,
  gateInviteDeny,
  searchGateInvite,
} from "../../services/inviteService";
import { getStoredAuthUser } from "../../services/authService";

const MobileGuardInvites = () => {
  const authUser = getStoredAuthUser();
  const [societyId, setSocietyId] = useState("1");
  const [gateId, setGateId] = useState("1");
  const [passCode, setPassCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const invite = result?.invite || null;
  const guest = result?.guest || null;

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchGateInvite({
        society_id: Number(societyId),
        pass_code: passCode || undefined,
        qr_code: qrCode || undefined,
        mobile: mobile || undefined,
      });
      setResult(res);
      if (res.valid) toast.success("Valid");
      else toast.error(res.reason || "Not valid");
    } catch (error) {
      console.error("MOBILE GUARD SEARCH ERROR:", error);
      setResult(null);
      toast.error(error?.response?.data?.message || "Invite not found");
    } finally {
      setLoading(false);
    }
  }, [mobile, passCode, qrCode, societyId]);

  const payload = () => ({
    society_id: Number(societyId),
    gate_id: Number(gateId || 1),
    invite_guest_id: guest?.id || undefined,
    pass_code: passCode || undefined,
    qr_code: qrCode || undefined,
  });

  const checkIn = async () => {
    if (!invite?.id) return;
    setBusy(true);
    try {
      const res = await gateInviteCheckIn(invite.id, payload());
      toast.success(res?.message || "Checked in");
      await search();
    } catch (error) {
      console.error("MOBILE CHECKIN ERROR:", error);
      toast.error(error?.response?.data?.message || "Check-in failed");
    } finally {
      setBusy(false);
    }
  };

  const checkOut = async () => {
    if (!invite?.id) return;
    setBusy(true);
    try {
      const res = await gateInviteCheckOut(invite.id, payload());
      toast.success(res?.message || "Checked out");
      await search();
    } catch (error) {
      console.error("MOBILE CHECKOUT ERROR:", error);
      toast.error(error?.response?.data?.message || "Check-out failed");
    } finally {
      setBusy(false);
    }
  };

  const deny = async () => {
    if (!invite?.id) return;
    const reason = window.prompt("Denial reason?", "Not allowed") || "Denied";
    setBusy(true);
    try {
      const res = await gateInviteDeny(invite.id, { ...payload(), denial_reason: reason });
      toast.success(res?.message || "Denied");
    } catch (error) {
      console.error("MOBILE DENY ERROR:", error);
      toast.error(error?.response?.data?.message || "Deny failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileLayout title="Guard • Gate Invites">
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
          Logged in as: {authUser?.full_name || "Guard"} ({authUser?.user_type || "security-guard"})
        </div>

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Search invite
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Society"
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                type="number"
                min={1}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <input
                placeholder="Gate"
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                type="number"
                min={1}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <input
              placeholder="Pass code (6-digit)"
              value={passCode}
              onChange={(e) => setPassCode(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <input
              placeholder="QR token"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <input
              placeholder="Mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />

            <Button onClick={search} loading={loading}>
              Search
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-500">
            <Spinner />
          </div>
        ) : result ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              #{invite?.id} • {invite?.invite_type}/{invite?.invite_sub_type}
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {guest?.guest_name || invite?.visitor_name || invite?.company_name || "-"}{" "}
              {guest?.mobile_number || invite?.mobile_number
                ? `• ${guest?.mobile_number || invite?.mobile_number}`
                : ""}
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Valid: {invite?.valid_from || "-"} → {invite?.valid_to || "-"} •{" "}
              {invite?.start_time || "-"} → {invite?.end_time || "-"}
            </div>

            <div className="mt-2 text-xs">
              {result.valid ? (
                <span className="rounded bg-green-100 px-2 py-1 text-green-800">
                  Entry Allowed
                </span>
              ) : (
                <span className="rounded bg-red-100 px-2 py-1 text-red-800">
                  Deny: {result.reason || "Not valid"}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button disabled={busy || !result.valid} onClick={checkIn}>
                In
              </Button>
              <Button disabled={busy} variant="outline" onClick={checkOut}>
                Out
              </Button>
              <Button disabled={busy} variant="danger" onClick={deny}>
                Deny
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
};

export default MobileGuardInvites;
