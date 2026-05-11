import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { toast } from "react-toastify";
import { getSocieties, getTowersBySociety } from "../../services/societyService";
import { getFlatsBySociety } from "../../services/flatsService";
import {
  checkInVisitorEntry,
  checkOutVisitorEntry,
  createVisitorEntry,
  getGuardVisitorEntries,
  getVisitorTypes,
  resolveResidentForUnit,
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

const GuardVisitors = () => {
  const [societies, setSocieties] = useState([]);
  const [societyId, setSocietyId] = useState(() => {
    const cached = Number(localStorage.getItem("visitor:test-society-id"));
    return Number.isFinite(cached) && cached > 0 ? cached : "";
  });
  const [guardId, setGuardId] = useState(1); // TEMP

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [visitorTypes, setVisitorTypes] = useState([]);
  const [entries, setEntries] = useState([]);

  const [towerId, setTowerId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [resolvedResident, setResolvedResident] = useState(null);

  const [form, setForm] = useState({
    visitor_name: "",
    visitor_phone: "",
    visitor_type_id: "",
    purpose: "",
    vehicle_number: "",
    no_of_visitors: 1,
    remarks: "",
  });

  const flatsForTower = useMemo(() => {
    const nextTowerId = Number(towerId);
    if (!nextTowerId) return [];
    const towerFlats = (flats || []).filter(
      (f) => Number(f.tower_id) === nextTowerId
    );

    const mergedFlatNumbers = new Set(
      towerFlats
        .map((f) => String(f.flat_number || ""))
        .filter((n) => n.includes("+"))
    );

    return towerFlats.filter((f) => {
      const flatNumber = String(f.flat_number || "");
      const unitType = String(f.unit_type || "");

      if (unitType.toUpperCase() === "MERGED") return false;
      if (flatNumber.startsWith("M-")) return false;

      // Show merged unit row like "101+102", hide member units to avoid duplicates.
      if (flatNumber.includes("+")) return true;
      if (mergedFlatNumbers.has(String(f.merged_from || ""))) return false;

      return true;
    });
  }, [flats, towerId]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const societyData = await getSocieties();
      const activeSocieties = societyData || [];
      setSocieties(activeSocieties);

      const nextSocietyId =
        Number(societyId) ||
        Number(activeSocieties?.[0]?.society_id) ||
        "";

      if (nextSocietyId && String(nextSocietyId) !== String(societyId || "")) {
        setSocietyId(String(nextSocietyId));
      }
      if (nextSocietyId) {
        localStorage.setItem("visitor:test-society-id", String(nextSocietyId));
      }

      const [towerData, flatData, typeData, entryData] = nextSocietyId
        ? await Promise.all([
            getTowersBySociety(nextSocietyId),
            getFlatsBySociety(nextSocietyId),
            getVisitorTypes(),
            getGuardVisitorEntries({ societyId: nextSocietyId }),
          ])
        : [[], [], await getVisitorTypes(), []];

      setTowers(towerData || []);
      setFlats(flatData || []);
      setVisitorTypes(typeData || []);
      setEntries(entryData || []);

      if ((towerData || []).length) {
        setTowerId(String(towerData[0].tower_id));
      }
    } catch (error) {
      console.error("LOAD GUARD VISITOR PAGE ERROR:", error);
      toast.error("Unable to load visitors");
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    setUnitId("");
    setResolvedResident(null);
  }, [towerId]);

  useEffect(() => {
    const run = async () => {
      const nextUnitId = Number(unitId);
      if (!nextUnitId) {
        setResolvedResident(null);
        return;
      }

      try {
        const data = await resolveResidentForUnit(nextUnitId);
        setResolvedResident(data);
      } catch (error) {
        console.error("RESOLVE RESIDENT ERROR:", error);
        setResolvedResident(null);
      }
    };

    run();
  }, [unitId]);

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextSocietyId = Number(societyId);
    const nextTowerId = Number(towerId);
    const nextUnitId = Number(unitId);

    if (!nextSocietyId) return toast.error("Select society");
    if (!nextTowerId) return toast.error("Select tower");
    if (!nextUnitId) return toast.error("Select unit");

    if (!String(form.visitor_name || "").trim()) return toast.error("Visitor name required");
    const phone = String(form.visitor_phone || "").replace(/\D/g, "");
    if (phone.length !== 10) return toast.error("Enter a valid 10-digit mobile number");

    setSubmitting(true);
    try {
      await createVisitorEntry({
        society_id: nextSocietyId,
        tower_id: nextTowerId,
        unit_id: nextUnitId,
        resident_user_id: resolvedResident?.resident_user_id || null,
        visitor_name: form.visitor_name,
        visitor_phone: phone,
        visitor_type_id: form.visitor_type_id ? Number(form.visitor_type_id) : null,
        purpose: form.purpose,
        vehicle_number: form.vehicle_number,
        no_of_visitors: Number(form.no_of_visitors || 1),
        remarks: form.remarks,
        user_id: guardId,
      });

      toast.success("Visitor request created");
      setForm({
        visitor_name: "",
        visitor_phone: "",
        visitor_type_id: "",
        purpose: "",
        vehicle_number: "",
        no_of_visitors: 1,
        remarks: "",
      });
      await loadPage();
    } catch (error) {
      console.error("CREATE VISITOR ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (id) => {
    setActionId(id);
    try {
      await checkInVisitorEntry(id);
      toast.success("Checked in");
      await loadPage();
    } catch (error) {
      console.error("CHECK IN ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to check in");
    } finally {
      setActionId(null);
    }
  };

  const handleCheckOut = async (id) => {
    setActionId(id);
    try {
      await checkOutVisitorEntry(id);
      toast.success("Checked out");
      await loadPage();
    } catch (error) {
      console.error("CHECK OUT ERROR:", error);
      toast.error(error?.response?.data?.error || "Unable to check out");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminLayout title="Guard Visitors">
      <div className="p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Visitor Management (Guard)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Temp testing: pick a society below, `requested_by_guard_id` from Guard ID.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Society
            </label>
            <select
              className="min-w-[220px] rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={societyId}
              onChange={(e) => setSocietyId(e.target.value)}
            >
              <option value="">Select society</option>
              {(societies || []).map((s) => (
                <option key={s.society_id} value={s.society_id}>
                  {s.society_name}
                </option>
              ))}
            </select>

            <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Guard ID
            </label>
            <input
              className="w-24 rounded border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={guardId}
              onChange={(e) => setGuardId(Number(e.target.value || 1))}
              type="number"
              min={1}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Add Visitor Request
              </h2>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Tower
                  </label>
                  <select
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={towerId}
                    onChange={(e) => setTowerId(e.target.value)}
                  >
                    {(towers || []).map((t) => (
                      <option key={t.tower_id} value={t.tower_id}>
                        {t.tower_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Unit
                  </label>
                  <select
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                  >
                    <option value="">Select unit</option>
                    {flatsForTower.map((f) => (
                      <option key={f.flat_id} value={f.flat_id}>
                        {f.flat_number}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Resident:{" "}
                    {resolvedResident?.resident_name ||
                      (unitId ? "Not assigned" : "-")}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Visitor Name
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.visitor_name}
                    onChange={(e) => updateForm("visitor_name", e.target.value)}
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Mobile Number
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.visitor_phone}
                    onChange={(e) => updateForm("visitor_phone", e.target.value)}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Visitor Type
                  </label>
                  <select
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.visitor_type_id}
                    onChange={(e) => updateForm("visitor_type_id", e.target.value)}
                  >
                    <option value="">Select type</option>
                    {(visitorTypes || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Purpose
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.purpose}
                    onChange={(e) => updateForm("purpose", e.target.value)}
                    placeholder="Purpose"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Vehicle Number
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.vehicle_number}
                    onChange={(e) => updateForm("vehicle_number", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Number of Visitors
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.no_of_visitors}
                    onChange={(e) => updateForm("no_of_visitors", e.target.value)}
                    type="number"
                    min={1}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">
                    Remarks
                  </label>
                  <input
                    className="w-full rounded border px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={form.remarks}
                    onChange={(e) => updateForm("remarks", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Visitor Entries
              </h2>

              {entries.length === 0 ? (
                <div className="py-6 text-sm text-gray-500 dark:text-gray-400">
                  No visitor entries yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        <th className="py-2 pr-3">Visitor</th>
                        <th className="py-2 pr-3">Phone</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Tower</th>
                        <th className="py-2 pr-3">Unit</th>
                        <th className="py-2 pr-3">Resident</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Requested</th>
                        <th className="py-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b last:border-b-0 dark:border-gray-700"
                        >
                          <td className="py-2 pr-3">{row.visitor_name}</td>
                          <td className="py-2 pr-3">{row.visitor_phone}</td>
                          <td className="py-2 pr-3">
                            {row.visitor_type_name || "-"}
                          </td>
                          <td className="py-2 pr-3">{row.tower_name || "-"}</td>
                          <td className="py-2 pr-3">{row.unit_number || "-"}</td>
                          <td className="py-2 pr-3">
                            {row.resident_name || "Not assigned"}
                          </td>
                          <td className="py-2 pr-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="py-2 pr-3">
                            {row.requested_at
                              ? new Date(row.requested_at).toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCheckIn(row.id)}
                                disabled={
                                  actionId === row.id || row.status !== "APPROVED"
                                }
                                className="px-3 py-1 text-xs"
                              >
                                Check In
                              </Button>
                              <Button
                                onClick={() => handleCheckOut(row.id)}
                                disabled={
                                  actionId === row.id ||
                                  row.status !== "CHECKED_IN"
                                }
                                className="px-3 py-1 text-xs"
                              >
                                Check Out
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default GuardVisitors;
