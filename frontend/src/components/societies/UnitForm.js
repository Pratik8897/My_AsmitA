import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import {
  generateUnits,
  getTowerConfigs,
} from "../../services/societyService";
import {
  bulkUpdateFlatUnitTypes,
  getFlatsBySociety,
  updateFlatStructure,
} from "../../services/flatsService";
import { Pencil, X } from "lucide-react";

const UNIT_OPTIONS = ["1BHK", "2BHK", "3BHK"];
const MAX_UNITS = 50;

const UnitForm = ({ towers = [], societyId, readOnly, onSuccess }) => {
  const [configs, setConfigs] = useState([]);
  const [activeTowerId, setActiveTowerId] = useState(null);
  const [editableFloors, setEditableFloors] = useState({});
  const [originalFloorSnapshot, setOriginalFloorSnapshot] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedFloors, setExpandedFloors] = useState({}); // {towerId: {floorNo: true/false}}

  const isEditable = (towerId, floorNo) =>
    !!editableFloors?.[towerId]?.[Number(floorNo)];

  const isExpanded = (towerId, floorNo) =>
    !!expandedFloors?.[towerId]?.[Number(floorNo)];

  const toggleFloorExpand = (towerId, floorNo) => {
    setExpandedFloors((prev) => {
      const next = { ...prev };
      const towerMap = { ...(next[towerId] || {}) };
      towerMap[Number(floorNo)] = !towerMap[Number(floorNo)];
      next[towerId] = towerMap;
      return next;
    });
  };

  const addFloor = (tIndex) => {
    setConfigs((prev) =>
      prev.map((t, i) => {
        if (i !== tIndex) return t;

        const maxFloor = t.floorConfigs.length > 0
          ? Math.max(...t.floorConfigs.map((f) => f.floor))
          : 0;

        const newFloor = {
          floor: maxFloor + 1,
          units: [],
          unitCount: 0,
          defaultType: "1BHK",
        };

        return {
          ...t,
          floorConfigs: [...t.floorConfigs, newFloor].sort((a, b) => a.floor - b.floor),
        };
      })
    );
  };

  /* ================= INIT ================= */
  useEffect(() => {
    if (!towers?.length) return;

    setActiveTowerId(towers[0]?.tower_id);
  }, [towers]);

  /* ================= LOAD EXISTING ================= */
  const loadConfigs = async () => {
    if (!societyId || !towers.length) return;

    try {
      const [towerConfigs, flats] = await Promise.all([
        getTowerConfigs(societyId),
        getFlatsBySociety(societyId),
      ]);

      const map = {};

      flats.forEach((f) => {
        const tId = f.tower_id;
        const floor = Number(f.floor_number);

        if (!map[tId]) map[tId] = {};
        if (!map[tId][floor]) map[tId][floor] = [];

        map[tId][floor].push({
          flat_id: f.flat_id,
          number: String(f.flat_number),
          type: f.unit_type || "1BHK",
        });
      });

      setConfigs(
        towers.map((t) => {
          const config = towerConfigs.find(
            (tc) => tc.tower_id === t.tower_id
          );

          const floors = map[t.tower_id] || {};

          const floorConfigs = Object.keys(floors)
            .map((floorNo) => {
              const units = floors[floorNo];

              return {
                floor: Number(floorNo),
                units,
                unitCount: units.length,
                defaultType:
                  units.every((u) => u.type === units[0].type)
                    ? units[0].type
                    : "1BHK",
              };
            })
            .sort((a, b) => a.floor - b.floor);

          return {
            tower_id: t.tower_id,
            tower_name: t.tower_name,
            total_floors: config?.total_floors || "",
            units_per_floor: config?.units_per_floor || "",
            floorConfigs,
            hasExistingUnits: floorConfigs.length > 0,
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [societyId, towers]);

  /* ================= EDIT TOGGLE ================= */
  const toggleFloorEdit = (towerId, floorNo, tIndex, fIndex) => {
    const fNo = Number(floorNo);

    setEditableFloors((prev) => {
      const next = { ...prev };
      const towerMap = { ...(next[towerId] || {}) };
      const isEditing = towerMap[fNo];

      if (!isEditing) {
        const snapshot = configs[tIndex].floorConfigs[fIndex];

        setOriginalFloorSnapshot((prevSnap) => ({
          ...prevSnap,
          [towerId]: {
            ...(prevSnap[towerId] || {}),
            [fNo]: JSON.parse(JSON.stringify(snapshot)),
          },
        }));
      } else {
        const snap = originalFloorSnapshot?.[towerId]?.[fNo];

        if (snap) {
          setConfigs((prev) =>
            prev.map((t) =>
              t.tower_id === towerId
                ? {
                    ...t,
                    floorConfigs: t.floorConfigs.map((f) =>
                      f.floor === fNo ? snap : f
                    ),
                  }
                : t
            )
          );
        }
      }

      towerMap[fNo] = !isEditing;
      next[towerId] = towerMap;
      return next;
    });
  };

  /* ================= UNIT COUNT ================= */
  const handleUnitCountChange = (tIndex, fIndex, value) => {
    const count = Math.min(Number(value || 0), MAX_UNITS);

    setConfigs((prev) =>
      prev.map((t, i) => {
        if (i !== tIndex) return t;

        return {
          ...t,
          floorConfigs: t.floorConfigs.map((f, idx) => {
            if (idx !== fIndex) return f;

            const units = [...f.units];

            if (count > units.length) {
              const extra = Array.from(
                { length: count - units.length },
                (_, j) => ({
                  number: `${f.floor}${String(units.length + j + 1).padStart(
                    2,
                    "0"
                  )}`,
                  type: f.defaultType,
                })
              );
              return { ...f, unitCount: count, units: [...units, ...extra] };
            }

            return { ...f, unitCount: count, units: units.slice(0, count) };
          }),
        };
      })
    );
  };

  /* ================= TYPE CHANGE ================= */
  const handleFloorTypeChange = (tIndex, fIndex, value) => {
    setConfigs((prev) =>
      prev.map((t, i) => {
        if (i !== tIndex) return t;

        return {
          ...t,
          floorConfigs: t.floorConfigs.map((f, idx) =>
            idx === fIndex
              ? {
                  ...f,
                  defaultType: value,
                  units: f.units.map((u) => ({ ...u, type: value })),
                }
              : f
          ),
        };
      })
    );
  };

  const handleUnitChange = (tIndex, fIndex, uIndex, value) => {
    setConfigs((prev) =>
      prev.map((t, i) => {
        if (i !== tIndex) return t;

        return {
          ...t,
          floorConfigs: t.floorConfigs.map((f, idx) =>
            idx === fIndex
              ? {
                  ...f,
                  units: f.units.map((u, ui) =>
                    ui === uIndex ? { ...u, type: value } : u
                  ),
                }
              : f
          ),
        };
      })
    );
  };

  const handleTowerConfigChange = (tIndex, key, value) => {
    setConfigs((prev) =>
      prev.map((t, i) =>
        i !== tIndex
          ? t
          : {
              ...t,
              [key]: value,
            }
      )
    );
  };

  const isGenerateValid = (tower) => {
    const totalFloors = Number(tower.total_floors);
    const unitsPerFloor = Number(tower.units_per_floor);
    return (
      Number.isInteger(totalFloors) &&
      totalFloors > 0 &&
      Number.isInteger(unitsPerFloor) &&
      unitsPerFloor > 0
    );
  };

  const handleGenerateTowerUnits = async (tIndex) => {
    const tower = configs[tIndex];
    const totalFloors = Number(tower.total_floors);
    const unitsPerFloor = Number(tower.units_per_floor);

    if (!isGenerateValid(tower)) {
      toast.error("Enter valid total floors and units per floor");
      return;
    }

    try {
      setLoading(true);
      await generateUnits({
        configs: [
          {
            tower_id: tower.tower_id,
            total_floors: totalFloors,
            units_per_floor: unitsPerFloor,
          },
        ],
      });

      toast.success("Units generated successfully");
      await loadConfigs();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ================= */
  const handleSaveFloor = async (tIndex, fIndex) => {
    try {
      const tower = configs[tIndex];
      const floor = tower.floorConfigs[fIndex];

      await updateFlatStructure({
        tower_id: tower.tower_id,
        floor_number: floor.floor,
        units: floor.units,
      });

      toast.success(`Floor ${floor.floor} updated`);

      toggleFloorEdit(tower.tower_id, floor.floor, tIndex, fIndex);
      await loadConfigs();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save floor");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="flex flex-col gap-4">

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2">
        {configs.map((t) => (
          <button
            key={t.tower_id}
            onClick={() => setActiveTowerId(t.tower_id)}
            className={`px-4 py-2 rounded ${
              activeTowerId === t.tower_id
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {t.tower_name}
          </button>
        ))}
      </div>

      {/* ACTIVE */}
      {configs
        .filter((c) => c.tower_id === activeTowerId)
        .map((c) => {
          const configIndex = configs.findIndex(
            (t) => t.tower_id === c.tower_id
          );

          return (
            <div key={c.tower_id} className="border p-4 rounded bg-white">

              {/* FLOORS */}
              {c.floorConfigs.length > 0 ? (
                <div>
                  {c.floorConfigs.map((floor, fIndex) => {
                    const expanded = isExpanded(c.tower_id, floor.floor);
                    const unitSummary = floor.units.reduce((acc, u) => {
                      acc[u.type] = (acc[u.type] || 0) + 1;
                      return acc;
                    }, {});
                    const summaryText = Object.entries(unitSummary)
                      .map(([type, count]) => `${count} ${type}`)
                      .join(", ");

                    return (
                      <div key={fIndex} className="bg-gray-100 p-4 rounded mb-3">
                        {/* SUMMARY */}
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleFloorExpand(c.tower_id, floor.floor)}
                        >
                          <div>
                            <b>Floor {floor.floor}</b> - {floor.units.length} units ({summaryText})
                          </div>
                          <span>{expanded ? "▼" : "▶"}</span>
                        </div>

                        {/* DETAILS */}
                        {expanded && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span></span>
                              <button
                                onClick={() =>
                                  toggleFloorEdit(c.tower_id, floor.floor, configIndex, fIndex)
                                }
                              >
                                {isEditable(c.tower_id, floor.floor) ? <X /> : <Pencil />}
                              </button>
                            </div>
                            <div className="flex gap-3 mb-2">
                              <Dropdown
                                value={floor.defaultType}
                                options={UNIT_OPTIONS}
                                disabled={!isEditable(c.tower_id, floor.floor)}
                                onChange={(v) =>
                                  handleFloorTypeChange(configIndex, fIndex, v)
                                }
                              />

                              <Input
                                value={floor.unitCount}
                                disabled={!isEditable(c.tower_id, floor.floor)}
                                onChange={(e) =>
                                  handleUnitCountChange(configIndex, fIndex, e.target.value)
                                }
                              />
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {floor.units.map((u, uIndex) => (
                                <div key={uIndex} className="border p-2 rounded bg-white flex justify-between">
                                  <span>{u.number}</span>
                                  <Dropdown
                                    value={u.type}
                                    options={UNIT_OPTIONS}
                                    disabled={!isEditable(c.tower_id, floor.floor)}
                                    onChange={(v) =>
                                      handleUnitChange(configIndex, fIndex, uIndex, v)
                                    }
                                  />
                                </div>
                              ))}
                            </div>

                            {isEditable(c.tower_id, floor.floor) && (
                              <div className="flex justify-end mt-3">
                                <Button onClick={() => handleSaveFloor(configIndex, fIndex)}>
                                  Save
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ADD FLOOR BUTTON */}
                  {!readOnly && (
                    <div className="flex justify-center mb-4">
                      <Button onClick={() => addFloor(configIndex)}>
                        + Add Floor
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded mb-3">
                  <div className="flex justify-between mb-4">
                    <div>
                      <b>No units found for this tower yet.</b>
                      <p className="text-sm text-gray-600">
                        Enter tower configuration and generate units manually.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Total Floors
                      </label>
                      <Input
                        value={c.total_floors}
                        disabled={readOnly}
                        onChange={(e) =>
                          handleTowerConfigChange(configIndex, "total_floors", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Units per Floor
                      </label>
                      <Input
                        value={c.units_per_floor}
                        disabled={readOnly}
                        onChange={(e) =>
                          handleTowerConfigChange(configIndex, "units_per_floor", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={
                        readOnly || !isGenerateValid(c)
                      }
                      onClick={() => handleGenerateTowerUnits(configIndex)}
                    >
                      Generate Units
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default UnitForm;