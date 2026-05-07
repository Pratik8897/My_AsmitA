import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import UnitForm from "../../components/societies/UnitForm";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";
import { mergeUnits, unmergeUnits } from "../../services/unitService";
import BulkImport from "../../components/BulkImport";


import {
  getTowersBySociety,
  getSocieties,
} from "../../services/societyService";

import {
  getFlatsBySociety,
  getFlatById,
} from "../../services/flatsService";


const UnitManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSocietyId = searchParams.get("societyId") || "";

  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [activeTowerId, setActiveTowerId] = useState(null);
  const [openFloor, setOpenFloor] = useState(null);

  const [search, setSearch] = useState("");

  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatModalOpen, setFlatModalOpen] = useState(false);

  const [mergeFloorId, setMergeFloorId] = useState(null);
  const [mergeSelected, setMergeSelected] = useState(new Set());

  const [importOpen, setImportOpen] = useState(false);

  // ================= FETCH =================
  const fetchSocieties = useCallback(async () => {
    const data = await getSocieties();
    setSocieties(data || []);

    if ((!selectedSocietyId || selectedSocietyId === "null") && data?.length) {
      setSearchParams({ societyId: String(data[0].society_id) });
    }
  }, [selectedSocietyId]);

  const fetchData = useCallback(async () => {
    if (!selectedSocietyId) return;

    setLoading(true);

    const [towerData, flatData] = await Promise.all([
      getTowersBySociety(selectedSocietyId),
      getFlatsBySociety(selectedSocietyId),
    ]);

    setTowers(towerData || []);
    setFlats(flatData || []);

    if (towerData?.length) {
      setActiveTowerId(towerData[0].tower_id);
    }

    setLoading(false);
  }, [selectedSocietyId]);

  useEffect(() => {
    fetchSocieties();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedSocietyId]);

  // ================= FILTER =================
  const filteredFlats = useMemo(() => {
    return flats
      .filter((f) => f.tower_id === activeTowerId)
      .filter((f) => {
        const q = search.toLowerCase();
        return (
          f.flat_number?.toString().includes(q) ||
          f.unit_type?.toLowerCase().includes(q) ||
          String(f.floor_number).includes(q)
        );
      });
  }, [flats, activeTowerId, search]);

  // ================= GROUP =================
  const groupedFloors = useMemo(() => {
    const map = {};

    filteredFlats.forEach((f) => {
      const floor = Number(f.floor_number);
      if (!map[floor]) map[floor] = [];
      map[floor].push(f);
    });

    return map;
  }, [filteredFlats]);

  const floors = Object.keys(groupedFloors).sort(
    (a, b) => Number(a) - Number(b)
  );

  // ================= HELPERS =================
  const selectedUnits = flats.filter((f) =>
    mergeSelected.has(f.flat_id)
  );

  const toggleMergeSelection = (flat) => {
    if (flat.unit_type === "Jodi") return;

    if (flat.is_merged) {
      toast.info("Already merged");
      return;
    }

    if (!mergeFloorId) setMergeFloorId(flat.floor_id);

    if (mergeFloorId && mergeFloorId !== flat.floor_id) {
      setMergeFloorId(flat.floor_id);
      setMergeSelected(new Set([flat.flat_id]));
      return;
    }

    setMergeSelected((prev) => {
      const next = new Set(prev);
      next.has(flat.flat_id)
        ? next.delete(flat.flat_id)
        : next.add(flat.flat_id);
      return next;
    });
  };

  const doMergeSelected = async () => {
    const ids = Array.from(mergeSelected);
    if (ids.length < 2) return;

    await mergeUnits({ flat_ids: ids });

    setMergeSelected(new Set());
    setMergeFloorId(null);
    fetchData();
  };

  const handleOpenFlat = async (flat) => {
    setFlatModalOpen(true);
    const data = await getFlatById(flat.flat_id);
    setSelectedFlat(data);
  };

  // ================= UI =================
  return (
    <AdminLayout>
      <div className="p-4">

        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Unit Management</h2>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button onClick={() => setImportOpen(true)}>Import Units</Button>
            <Button onClick={() => setOpen(true)}>Generate / Update Units</Button>
          </div>
        </div>

        {/* SOCIETY */}
        <select
          value={selectedSocietyId}
          onChange={(e) => {
            setSearchParams({ societyId: e.target.value });
            setMergeSelected(new Set());
            setMergeFloorId(null);
          }}
          className="border px-3 py-2 rounded mb-4"
        >
          {societies.map((s) => (
            <option key={s.society_id} value={s.society_id}>
              {s.society_name}
            </option>
          ))}
        </select>

        {/* TOWER TABS */}
        <div className="flex gap-2 mb-4">
          {towers.map((t) => (
            <button
              key={t.tower_id}
              onClick={() => {
                setActiveTowerId(t.tower_id);
                setMergeSelected(new Set());
                setMergeFloorId(null);
                setOpenFloor(null);
              }}
              className={`px-4 py-2 rounded ${
                activeTowerId === t.tower_id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
             Tower - {t.tower_name}
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search unit / floor / type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-4"
        />


        {/* MERGE BAR */}


        {mergeSelected.size > 0 && (
          <div className="mb-3 p-2 border bg-blue-50 rounded flex justify-between">
            <div className="flex gap-2 text-xs flex-wrap">
              {selectedUnits.map((u) => (
                <div key={u.flat_id} className="bg-white px-2 py-1 rounded border">
                  {u.flat_number}
                </div>
              ))}
            </div>

            <Button onClick={doMergeSelected}>
              Merge ({mergeSelected.size})
            </Button>
          </div>
        )}


        {/* FLOORS */}
        {loading ? (

          <Spinner />

        ) : (
          <div className="flex flex-col gap-3 flex-wrap md:flex-row">
            {floors.map((floorId) => {
              const isOpen = openFloor === floorId;

              return (
                <div key={floorId} className="border rounded bg-gray-50 md:w-[49%]">

                  {/* HEADER */}

                  <div
                    onClick={() => {
                      const next = isOpen ? null : floorId;
                      setOpenFloor(next);

                      // reset merge
                      setMergeSelected(new Set());
                      setMergeFloorId(null);
                    }}
                    className="px-4 py-3 cursor-pointer flex justify-between "
                  >
                    <span className="font-semibold">
                      Floor {floorId}
                    </span>
                    <span>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* CONTENT */}
                  {isOpen && (
                    <div className="p-3 flex flex-wrap gap-2">
                      {groupedFloors[floorId].map((u) => (
                        <div
                          key={u.flat_id}
                          onClick={() => handleOpenFlat(u)}
                          className={`relative px-3 py-2 rounded-md border text-xs cursor-pointer flex h-[5rem] ${
                            u.unit_type === "Jodi"
                              ? "bg-red-100 text-red-700"
                              : u.is_merged
                              ? "bg-gray-100 text-gray-500"
                              : "bg-blue-100 text-blue-700"
                          } ${
                            mergeSelected.has(u.flat_id)
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                        >
                          <div className="font-semibold flex align-middle items-center">
                            {u.flat_number} ({u.unit_type})
                          </div>

                          {u.unit_type !== "Jodi" && !u.is_merged && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMergeSelection(u);
                              }}
                              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border bg-white"
                            >
                              {mergeSelected.has(u.flat_id) ? "✓" : "+"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODALS */}
        <Modal isOpen={open} onClose={() => setOpen(false)}>
          <UnitForm
            towers={towers}
            societyId={selectedSocietyId}
            onSuccess={fetchData}
          />
        </Modal>

        <Modal
      isOpen={flatModalOpen}
      onClose={() => setFlatModalOpen(false)}
      title="Flat Details"
    >
      {selectedFlat ? (
        <div className="space-y-3 text-sm">

          <p><strong>Flat:</strong> {selectedFlat.flat_number}</p>
          <p><strong>Type:</strong> {selectedFlat.unit_type}</p>
          <p><strong>Owner:</strong> {selectedFlat.owner_name || "N/A"}</p>
          <p><strong>Phone:</strong> {selectedFlat.phone || "N/A"}</p>
          <p><strong>Email:</strong> {selectedFlat.email || "N/A"}</p>

          {/* ✅ UNMERGE BUTTON */}
          {selectedFlat.unit_type === "Jodi" && (
            <div className="pt-3 border-t">

              <Button
                variant="danger"
                onClick={async () => {
                  if (!window.confirm("Unmerge this unit?")) return;

                  try {
                    await unmergeUnits({
                      merged_unit_id: selectedFlat.merged_unit_id,
                    });

                    toast.success("Units unmerged");

                    setFlatModalOpen(false);
                    fetchData(); // refresh UI

                  } catch (err) {
                    console.error(err);
                    toast.error("Unmerge failed");
                  }
                }}
              >
                Unmerge Units
              </Button>

            </div>
          )}

        </div>
      ) : (
        <Spinner />
      )}
    </Modal>
    <Modal
      isOpen={importOpen}
      onClose={() => setImportOpen(false)}
      title="Bulk Import Units"
      className="max-w-2xl"
    >
        <BulkImport
          societyId={selectedSocietyId}
          onSuccess={(data) => {
            fetchData(); // refresh units
            if (!data?.failedCount) setImportOpen(false);
          }}
        />
      </Modal>

      </div>
    </AdminLayout>
  );
};

export default UnitManagement;
