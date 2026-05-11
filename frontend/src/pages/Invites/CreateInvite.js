import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { getSocieties, getTowersBySociety } from "../../services/societyService";
import { getFlatsBySociety } from "../../services/flatsService";
import { createPreApprovedInvite } from "../../services/inviteService";

const INVITE_TYPES = [
  { id: "guest", label: "Guest" },
  { id: "cab", label: "Cab" },
  { id: "delivery", label: "Delivery" },
];

const SUB_TYPES_BY_TYPE = {
  guest: [
    { id: "quick", label: "Quick" },
    { id: "group", label: "Party / Group" },
    { id: "frequent", label: "Frequent" },
    { id: "private", label: "Private" },
  ],
  cab: [
    { id: "once", label: "Once" },
    { id: "frequent", label: "Frequent" },
  ],
  delivery: [
    { id: "once", label: "Once" },
    { id: "frequent", label: "Frequent" },
  ],
};

const CreateInvite = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [societies, setSocieties] = useState([]);
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);

  const [societyId, setSocietyId] = useState("");
  const [towerId, setTowerId] = useState("");
  const [unitId, setUnitId] = useState("");

  const [form, setForm] = useState({
    invite_type: "guest",
    invite_sub_type: "quick",
    title: "",
    visitor_name: "",
    mobile_number: "",
    company_name: "",
    vehicle_number: "",
    purpose: "",
    valid_from: "",
    valid_to: "",
    start_time: "",
    end_time: "",
    entries_per_day: 1,
    max_guest_count: 10,
    allowed_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    is_private: false,
    approval_required: false,
    guests: [],
  });

  const flatsForTower = useMemo(() => {
    const nextTowerId = Number(towerId);
    if (!nextTowerId) return [];
    return (flats || []).filter((f) => Number(f.tower_id) === nextTowerId);
  }, [flats, towerId]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const societyData = await getSocieties();
      const active = societyData || [];
      setSocieties(active);
      const nextSocietyId = Number(active?.[0]?.society_id) || "";
      setSocietyId(nextSocietyId ? String(nextSocietyId) : "");

      if (nextSocietyId) {
        const [towerData, flatData] = await Promise.all([
          getTowersBySociety(nextSocietyId),
          getFlatsBySociety(nextSocietyId),
        ]);
        setTowers(towerData || []);
        setFlats(flatData || []);
        if ((towerData || []).length) setTowerId(String(towerData[0].tower_id));
      }
    } catch (error) {
      console.error("LOAD CREATE INVITE ERROR:", error);
      toast.error("Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    const run = async () => {
      const nextSocietyId = Number(societyId);
      if (!nextSocietyId) return;
      try {
        const [towerData, flatData] = await Promise.all([
          getTowersBySociety(nextSocietyId),
          getFlatsBySociety(nextSocietyId),
        ]);
        setTowers(towerData || []);
        setFlats(flatData || []);
        if ((towerData || []).length) setTowerId(String(towerData[0].tower_id));
      } catch (error) {
        console.error("RELOAD SOCIETY DATA ERROR:", error);
      }
    };

    run();
  }, [societyId]);

  useEffect(() => {
    setUnitId("");
  }, [towerId]);

  useEffect(() => {
    const nextType = form.invite_type;
    const allowed = SUB_TYPES_BY_TYPE[nextType] || [];
    if (!allowed.find((s) => s.id === form.invite_sub_type)) {
      setForm((prev) => ({ ...prev, invite_sub_type: allowed?.[0]?.id || "quick" }));
    }
  }, [form.invite_type, form.invite_sub_type]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextSocietyId = Number(societyId);
    const nextTowerId = Number(towerId);
    const nextUnitId = Number(unitId);

    if (!nextSocietyId) return toast.error("Select society");
    if (!nextTowerId) return toast.error("Select tower");
    if (!nextUnitId) return toast.error("Select unit");

    if (!String(form.valid_from || "").trim()) return toast.error("valid_from required");
    if (!String(form.valid_to || "").trim()) return toast.error("valid_to required");

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
      navigate(`/resident/invites/${res?.invite?.id || ""}`);
    } catch (error) {
      console.error("CREATE INVITE ERROR:", error);
      toast.error(error?.response?.data?.message || "Unable to create invite");
    } finally {
      setSubmitting(false);
    }
  };

  const subTypes = SUB_TYPES_BY_TYPE[form.invite_type] || [];
  const isGroup = form.invite_sub_type === "group";
  const showVisitorName = form.invite_type === "guest" || form.invite_type === "cab";
  const addGuest = () =>
    updateForm("guests", [
      ...(form.guests || []),
      { guest_name: "", mobile_number: "", vehicle_number: "" },
    ]);

  const updateGuest = (index, key, value) =>
    updateForm(
      "guests",
      (form.guests || []).map((g, i) => (i === index ? { ...g, [key]: value } : g))
    );

  const removeGuest = (index) =>
    updateForm(
      "guests",
      (form.guests || []).filter((_, i) => i !== index)
    );

  if (loading) {
    return (
      <AdminLayout title="Create Invite">
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create Invite">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Society
              </div>
              <select
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {societies.map((s) => (
                  <option key={s.society_id} value={s.society_id}>
                    {s.society_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Tower
              </div>
              <select
                value={towerId}
                onChange={(e) => setTowerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {towers.map((t) => (
                  <option key={t.tower_id} value={t.tower_id}>
                    {t.tower_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Unit
              </div>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Select unit</option>
                {flatsForTower.map((f) => (
                  <option key={f.flat_id} value={f.flat_id}>
                    {f.flat_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Invite Type
              </div>
              <select
                value={form.invite_type}
                onChange={(e) => updateForm("invite_type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {INVITE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Sub Type
              </div>
              <select
                value={form.invite_sub_type}
                onChange={(e) => updateForm("invite_sub_type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {subTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Title
              </div>
              <input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="e.g. Mom visiting / Amazon delivery"
              />
            </div>

            {showVisitorName ? (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  Visitor Name
                </div>
                <input
                  value={form.visitor_name}
                  onChange={(e) => updateForm("visitor_name", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            ) : null}

            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Mobile Number
              </div>
              <input
                value={form.mobile_number}
                onChange={(e) => updateForm("mobile_number", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="10-digit"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Company Name
              </div>
              <input
                value={form.company_name}
                onChange={(e) => updateForm("company_name", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Cab/Delivery company"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Vehicle Number
              </div>
              <input
                value={form.vehicle_number}
                onChange={(e) => updateForm("vehicle_number", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-3">
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Purpose
              </div>
              <input
                value={form.purpose}
                onChange={(e) => updateForm("purpose", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Valid From
              </div>
              <input
                type="date"
                value={form.valid_from}
                onChange={(e) => updateForm("valid_from", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                Valid To
              </div>
              <input
                type="date"
                value={form.valid_to}
                onChange={(e) => updateForm("valid_to", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  Start Time
                </div>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => updateForm("start_time", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  End Time
                </div>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => updateForm("end_time", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {isGroup ? (
            <div className="mt-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Group Guests (optional)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Add guest list to generate individual pass codes.
              </div>

              <div className="mt-3 grid gap-2">
                {(form.guests || []).map((g, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-4"
                  >
                    <input
                      placeholder="Guest name"
                      value={g.guest_name || ""}
                      onChange={(e) => updateGuest(idx, "guest_name", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <input
                      placeholder="Mobile"
                      value={g.mobile_number || ""}
                      onChange={(e) => updateGuest(idx, "mobile_number", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <input
                      placeholder="Vehicle (optional)"
                      value={g.vehicle_number || ""}
                      onChange={(e) => updateGuest(idx, "vehicle_number", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="danger"
                        className="px-3 py-1 text-xs"
                        onClick={() => removeGuest(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div>
                  <Button type="button" variant="outline" onClick={addGuest}>
                    Add Guest
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => navigate("/resident/invites")}>
              Back
            </Button>
            <Button type="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CreateInvite;
