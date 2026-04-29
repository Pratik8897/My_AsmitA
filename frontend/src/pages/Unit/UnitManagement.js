import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import UnitForm from "../../components/societies/UnitForm";
import { toast } from "react-toastify";

import {
  getTowersBySociety,
  getSocieties,
} from "../../services/societyService";

import {
  getFlatsBySociety,
  getFlatById,
} from "../../services/flatsService";
import { mergeUnits, unmergeUnits } from "../../services/unitService";

const UnitManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSocietyId = searchParams.get("societyId") || "";
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatModalOpen, setFlatModalOpen] = useState(false);

  const [mergeFloorId, setMergeFloorId] = useState(null);
  const [mergeSelected, setMergeSelected] = useState(() => new Set());

  // ================= Handle Flat Click =================
  const handleOpenFlat = async (flat) => {
    setFlatModalOpen(true);
    setSelectedFlat(null);

    try {
      const data = await getFlatById(flat.flat_id);
      setSelectedFlat(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= Fetch Societies =================
  const fetchSocieties = useCallback(async () => {
    try {
      const data = await getSocieties();
      setSocieties(data || []);
      if ((!selectedSocietyId || selectedSocietyId === "null") && data?.length) {
        setSearchParams({ societyId: String(data[0].society_id) });
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedSocietyId, setSearchParams]);

  // ================= Fetch Towers + Flats =================
  const fetchData = useCallback(async () => {
    if (!selectedSocietyId) return;

    try {
      setLoading(true);

      const [towerData, flatData] = await Promise.all([
        getTowersBySociety(selectedSocietyId),
        getFlatsBySociety(selectedSocietyId),
      ]);

      setTowers(towerData || []);
      setFlats(flatData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSocietyId]);

  useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSocietyChange = (e) => {
    setSearchParams({ societyId: e.target.value });
    setMergeFloorId(null);
    setMergeSelected(new Set());
  };

  const selectedSocietyName = useMemo(() => {
    const match = societies.find((s) => String(s.society_id) === String(selectedSocietyId));
    return match?.society_name || "";
  }, [societies, selectedSocietyId]);

  const selectedUnits = useMemo(() => {
    const selected = flats.filter((f) => mergeSelected.has(f.flat_id));
    return selected.sort((a, b) =>
      String(a.flat_number).localeCompare(String(b.flat_number), undefined, {
        numeric: true,
      })
    );
  }, [flats, mergeSelected]);

  const toggleMergeSelection = (flat) => {
    if (flat?.unit_type === "Jodi") return;

    if (flat?.is_merged) {
      toast.info("This unit is already part of a merged (Jodi) unit");
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
      if (next.has(flat.flat_id)) next.delete(flat.flat_id);
      else next.add(flat.flat_id);
      return next;
    });
  };

  const doMergeSelected = async () => {
    const ids = Array.from(mergeSelected);
    if (ids.length < 2) return;

    if (!window.confirm(`Merge ${ids.length} units into a Jodi unit?`)) return;

    try {
      await mergeUnits({ flat_ids: ids });
      setMergeSelected(new Set());
      setMergeFloorId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= Group Flats by Floor =================
  const towerWithUnits = towers.map((tower) => {
    const towerFlats = flats.filter(
      (f) => f.tower_id === tower.tower_id
    );

    const grouped = {};

    towerFlats.forEach((f) => {
      const floor = Number(f.floor_number);

      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(f);
    });

    Object.keys(grouped).forEach((floor) => {
      grouped[floor].sort((a, b) =>
        String(a.flat_number).localeCompare(String(b.flat_number), undefined, {
          numeric: true,
        })
      );
    });

    return {
      ...tower,
      unitsByFloor: grouped,
    };
  });

  // ================= Table Columns =================
  const columns = [
    {
      header: "Sr No",
      render: (_, i) => i + 1,
    },
    {
      header: "Tower",
      accessor: "tower_name",
    },
    {
      header: "Units",
      render: (row) => {
        const floors = Object.keys(row.unitsByFloor || {}).sort(
          (a, b) => Number(a) - Number(b)
        );

        return (
          <div className="flex flex-col gap-2 max-w-[400px]">
            {floors.length ? (
              floors.map((floorId) => (
                <div key={floorId}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Floor {floorId}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {row.unitsByFloor[floorId].map((u, i) => (
                      <div
                        key={i}
                        onClick={() => handleOpenFlat(u)}
                        title="Click to view details"
                        className={`h-14 min-w-[96px] relative cursor-pointer px-3 py-2 text-xs rounded-md hover:opacity-80 border ${
                          u.unit_type === "Jodi"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : u.is_merged
                              ? "bg-gray-100 text-gray-500 border-gray-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-semibold">
                          <span>{u.flat_number}</span>
                          <span className="text-[10px] opacity-80 font-medium">
                            ({u.unit_type})
                          </span>
                        </div>

                        {/* Merge selector (separate action so single click keeps opening details) */}
                        {u.unit_type !== "Jodi" && !u.is_merged && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMergeSelection(u);
                            }}
                            title="Select for merge"
                            className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border text-[12px] flex items-center justify-center bg-white shadow-sm ${
                              mergeSelected.has(u.flat_id)
                                ? "border-blue-500 text-blue-700"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {mergeSelected.has(u.flat_id) ? "✓" : "+"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              ))
            ) : (
              <span className="text-gray-400">No units</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <AdminLayout>
        <DataTableLayout
          title={`Unit Management${selectedSocietyName ? ` - ${selectedSocietyName}` : ""}`}
          filters={
            <select
              value={selectedSocietyId}
              onChange={handleSocietyChange}
              className="border px-3 py-2 rounded w-64"
            >
              <option value="">Select Society</option>
              {societies.map((s) => (
                <option key={s.society_id} value={s.society_id}>
                  {s.society_name}
                </option>
              ))}
            </select>
          }
          actions={
            <Button onClick={() => setOpen(true)} disabled={!selectedSocietyId}>
              Generate / Update Units
            </Button>
          }
        >
          {mergeSelected.size > 0 && (
            <div className="mb-3 p-3 rounded border bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  Selected for merge (same floor only)
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={doMergeSelected}
                    disabled={mergeSelected.size < 2}
                  >
                    Merge Selected ({mergeSelected.size})
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 underline"
                    onClick={() => {
                      setMergeSelected(new Set());
                      setMergeFloorId(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUnits.map((u) => (
                  <div
                    key={u.flat_id}
                    className="text-xs px-2 py-1 rounded border bg-gray-50"
                    title={`Type: ${u.unit_type || "N/A"} | Status: ${u.status || "N/A"}`}
                  >
                    <span className="font-semibold">{u.flat_number}</span>
                    <span className="ml-1 opacity-70">({u.unit_type})</span>
                    <button
                      type="button"
                      className="ml-2 text-gray-500 underline"
                      onClick={() => handleOpenFlat(u)}
                    >
                      Info
                    </button>
                    <button
                      type="button"
                      className="ml-2 text-red-600 underline"
                      onClick={() => toggleMergeSelection(u)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <p className="p-4">Loading...</p>
          ) : (
            <DataTable columns={columns} data={towerWithUnits} />
          )}
        </DataTableLayout>

        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Generate Units"
        >
          <UnitForm
            towers={towers}
            societyId={selectedSocietyId}
            onSuccess={() => {
              setOpen(false);
              fetchData();
            }}
          />
        </Modal>
      </AdminLayout>

      {/* ================= Flat Details Modal ================= */}
      <Modal
        isOpen={flatModalOpen}
        onClose={() => setFlatModalOpen(false)}
        title="Flat Details"
      >
        {selectedFlat ? (
          <div className="space-y-2 text-sm">
            <p><strong>Flat:</strong> {selectedFlat.flat_number}</p>
            <p><strong>Type:</strong> {selectedFlat.unit_type}</p>
            <p><strong>Owner:</strong> {selectedFlat.owner_name || "N/A"}</p>
            <p><strong>Phone:</strong> {selectedFlat.phone || "N/A"}</p>
            <p><strong>Email:</strong> {selectedFlat.email || "N/A"}</p>

            {selectedFlat.is_merged && (
              <p className="text-red-500">
                Merged: {selectedFlat.merged_from}
              </p>
            )}

            {selectedFlat.unit_type === "Jodi" && selectedFlat.merged_unit_id && (
              <div className="pt-2">
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm("Unmerge this Jodi unit?")) return;
                    try {
                      await unmergeUnits({ merged_unit_id: selectedFlat.merged_unit_id });
                      setFlatModalOpen(false);
                      fetchData();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Unmerge
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Modal>
    </>
  );
};

export default UnitManagement;
