import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import MobileLayout from "./MobileLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { createPreApprovedInvite, getMyPreApprovedInvites } from "../../services/inviteService";
import { getStoredAuthUser } from "../../services/authService";
import { getSocieties, getTowersBySociety } from "../../services/societyService";
import { getFlatsBySociety } from "../../services/flatsService";

const todayYyyyMmDd = () => {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const MobileResidentInvites = () => {
  const authUser = getStoredAuthUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState([]);

  const [societies, setSocieties] = useState([]);
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);

  const [societyId, setSocietyId] = useState(() => {
    const cached = Number(localStorage.getItem("mobile:resident:society_id"));
    return Number.isFinite(cached) && cached > 0 ? String(cached) : "";
  });
  const [towerId, setTowerId] = useState(() => {
    const cached = Number(localStorage.getItem("mobile:resident:tower_id"));
    return Number.isFinite(cached) && cached > 0 ? String(cached) : "";
  });
  const [unitId, setUnitId] = useState(() => {
    const cached = Number(localStorage.getItem("mobile:resident:unit_id"));
    return Number.isFinite(cached) && cached > 0 ? String(cached) : "";
  });

  const [form, setForm] = useState({
    invite_type: "guest",
    invite_sub_type: "quick",
    title: "Quick invite",
    visitor_name: "Guest",
    mobile_number: "",
    purpose: "Visit",
    valid_from: todayYyyyMmDd(),
    valid_to: todayYyyyMmDd(),
    start_time: "10:00",
    end_time: "22:00",
    entries_per_day: 1,
  });

  const invites = useMemo(() => rows || [], [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inviteRes, societyRes] = await Promise.all([
        getMyPreApprovedInvites(),
        getSocieties(),
      ]);

      setRows(inviteRes.invites || []);
      const activeSocieties = societyRes || [];
      setSocieties(activeSocieties);

      const nextSocietyId =
        Number(societyId) ||
        Number(authUser?.society_id) ||
        Number(activeSocieties?.[0]?.society_id) ||
        "";

      if (nextSocietyId) {
        setSocietyId(String(nextSocietyId));
        localStorage.setItem("mobile:resident:society_id", String(nextSocietyId));
        const [towerData, flatData] = await Promise.all([
          getTowersBySociety(nextSocietyId),
          getFlatsBySociety(nextSocietyId),
        ]);
        setTowers(towerData || []);
        setFlats(flatData || []);

        const nextTowerId = Number(towerId) || Number(towerData?.[0]?.tower_id) || "";
        if (nextTowerId) {
          setTowerId(String(nextTowerId));
          localStorage.setItem("mobile:resident:tower_id", String(nextTowerId));
        }
      }
    } catch (error) {
      console.error("MOBILE RESIDENT INVITES LOAD ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to load invites");
    } finally {
      setLoading(false);
    }
  }, [authUser?.society_id, societyId, towerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      const nextSocietyId = Number(societyId);
      if (!nextSocietyId) return;

      try {
        localStorage.setItem("mobile:resident:society_id", String(nextSocietyId));
        const [towerData, flatData] = await Promise.all([
          getTowersBySociety(nextSocietyId),
          getFlatsBySociety(nextSocietyId),
        ]);
        setTowers(towerData || []);
        setFlats(flatData || []);

        const nextTowerId = Number(towerData?.[0]?.tower_id) || "";
        if (!Number(towerId) && nextTowerId) {
          setTowerId(String(nextTowerId));
          localStorage.setItem("mobile:resident:tower_id", String(nextTowerId));
        }
      } catch (error) {
        console.error("MOBILE RESIDENT LOAD SOCIETY ERROR:", error);
      }
    };

    run();
  }, [societyId, towerId]);

  useEffect(() => {
    if (towerId) localStorage.setItem("mobile:resident:tower_id", String(towerId));
    setUnitId("");
  }, [towerId]);

  useEffect(() => {
    if (unitId) localStorage.setItem("mobile:resident:unit_id", String(unitId));
  }, [unitId]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createInvite = async () => {
    const nextSocietyId = Number(societyId);
    const nextTowerId = Number(towerId);
    const nextUnitId = Number(unitId);
    if (!nextSocietyId) return toast.error("Select society");
    if (!nextTowerId) return toast.error("Select tower");
    if (!nextUnitId) return toast.error("Select unit");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        society_id: nextSocietyId,
        tower_id: nextTowerId,
        unit_id: nextUnitId,
        mobile_number: String(form.mobile_number || "").replace(/\D/g, ""),
      };
      const res = await createPreApprovedInvite(payload);
      toast.success("Invite created");
      await load();
      if (res?.invite?.pass_code) {
        navigator.clipboard?.writeText(String(res.invite.pass_code)).catch(() => {});
      }
    } catch (error) {
      console.error("MOBILE CREATE INVITE ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to create invite");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Resident • Invites">
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
          Logged in as: {authUser?.full_name || "Resident"} ({authUser?.user_type || "user"})
        </div>

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Create quick invite
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-1 gap-2">
              <select
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="">Select society</option>
                {societies.map((s) => (
                  <option key={s.society_id} value={s.society_id}>
                    {s.society_name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={towerId}
                  onChange={(e) => setTowerId(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  disabled={!societyId}
                >
                  <option value="">Select tower</option>
                  {towers.map((t) => (
                    <option key={t.tower_id} value={t.tower_id}>
                      {t.tower_name}
                    </option>
                  ))}
                </select>

                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  disabled={!towerId}
                >
                  <option value="">Select unit</option>
                  {flats
                    .filter((f) => Number(f.tower_id) === Number(towerId))
                    .map((f) => (
                      <option key={f.flat_id} value={f.flat_id}>
                        {f.flat_number}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <input
              placeholder="Mobile number (10-digit)"
              value={form.mobile_number}
              onChange={(e) => update("mobile_number", e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <input
              placeholder="Visitor name"
              value={form.visitor_name}
              onChange={(e) => update("visitor_name", e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.valid_from}
                onChange={(e) => update("valid_from", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <input
                type="date"
                value={form.valid_to}
                onChange={(e) => update("valid_to", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => update("start_time", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => update("end_time", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>

            <Button onClick={createInvite} loading={submitting}>
              Create Invite
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            My Invites
          </div>
          <Button variant="outline" className="px-3 py-1 text-xs" onClick={load}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-500">
            <Spinner />
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow dark:bg-gray-950 dark:text-gray-300">
            No invites yet.
          </div>
        ) : (
          <div className="space-y-2">
            {invites.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-950"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    #{inv.id} • {inv.invite_type}/{inv.invite_sub_type}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    {inv.status}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {inv.visitor_name || inv.company_name || "-"}{" "}
                  {inv.mobile_number ? `• ${inv.mobile_number}` : ""}
                </div>
                <div className="mt-2 rounded bg-gray-50 p-2 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                  Pass: {inv.pass_code || "-"}
                  <div className="mt-1 opacity-70">QR: {inv.qr_code || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileResidentInvites;
