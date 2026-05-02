import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import { generateUnits, getTowerConfigs } from "../../services/societyService";
import { bulkUpdateFlatUnitTypes, getFlatsBySociety, updateFlatStructure } from "../../services/flatsService";
import { Pencil, X  } from "lucide-react";

const UNIT_OPTIONS = ["1BHK", "2BHK", "3BHK"];
const MAX_FLOORS = 99;
const MAX_UNITS = 50;

const UnitForm = ({
  towers = [],
  societyId = null,
  readOnly = false,
  onBack,
  onSuccess,
}) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingByTowerId, setExistingByTowerId] = useState({});
  const [existingFloorsByTowerId, setExistingFloorsByTowerId] = useState({});
  const [editableFloors, setEditableFloors] = useState({});
  const [originalFloorSnapshot, setOriginalFloorSnapshot] = useState({});
  
  const isFloorEditable = (towerId, floorNo) =>
    !!editableFloors?.[towerId]?.[floorNo];

  const toggleFloorEdit = (towerId, floorNo, towerIndex, floorIndex) => {
    setEditableFloors((prev) => {
      const next = { ...(prev || {}) };
      const towerMap = { ...(next[towerId] || {}) };

      const isEditing = towerMap[floorNo];

      if (!isEditing) {
        // 🔥 START EDIT → SAVE SNAPSHOT
        const floorData = configs[towerIndex].floorConfigs[floorIndex];

        setOriginalFloorSnapshot((prevSnap) => ({
          ...prevSnap,
          [towerId]: {
            ...(prevSnap[towerId] || {}),
            [floorNo]: JSON.parse(JSON.stringify(floorData)),
          },
        }));
      } else {
        // 🔥 CANCEL EDIT → RESTORE SNAPSHOT
        const snapshot =
          originalFloorSnapshot?.[towerId]?.[floorNo];

        if (snapshot) {
          setConfigs((prevConfigs) =>
            prevConfigs.map((t) => {
              if (t.tower_id !== towerId) return t;

              return {
                ...t,
                floorConfigs: t.floorConfigs.map((f) =>
                  f.floor === floorNo ? snapshot : f
                ),
              };
            })
          );
        }
      }

      towerMap[floorNo] = !isEditing;
      next[towerId] = towerMap;

      return next;
    });
  };

  const setFieldError = (towerId, field, message) => {
    if (!towerId) return;

    setErrors((prev) => {
      const next = { ...(prev || {}) };
      next[towerId] = { ...(next[towerId] || {}), [field]: message };

      if (!message) {
        delete next[towerId][field];
        if (Object.keys(next[towerId]).length === 0) delete next[towerId];
      }

      return next;
    });
  };

  const notifyLimit = (towerId, towerName, field, limit) => {
    const label =
      field === "total_floors" ? "Total floors" : "Units per floor";

    toast.warn(`${towerName}: ${label} cannot be greater than ${limit}`, {
      toastId: `limit-${towerId}-${field}`,
    });
  };

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (!towers?.length) return;

    setConfigs((prev) => {
      const prevById = Object.fromEntries(
        (prev || []).map((c) => [c.tower_id, c])
      );

      return towers.map((t) => {
        const prevC = prevById[t.tower_id];
        const existing = existingByTowerId[t.tower_id];
        const existingFloors = existingFloorsByTowerId[t.tower_id];

        return {
          tower_id: t.tower_id,
          tower_name: t.tower_name,
          total_floors:
            existing?.total_floors != null
              ? String(existing.total_floors)
              : prevC?.total_floors || "",
          units_per_floor:
            existing?.units_per_floor != null
              ? String(existing.units_per_floor)
              : prevC?.units_per_floor || "",
          floorConfigs:
            existing?.hasUnits && Array.isArray(existingFloors)
              ? existingFloors
              : prevC?.floorConfigs || [],
          hasExistingUnits: !!existing?.hasUnits,
          existingUnitsCount: existing?.unitsCount || 0,
        };
      });
    });
  }, [towers, existingByTowerId, existingFloorsByTowerId]);

  /* ---------------- LOAD EXISTING UNITS ---------------- */
  useEffect(() => {
    const loadConfigs = async () => {
      if (!societyId) return;

      try {
        const data = await getTowerConfigs(societyId);
        const map = {};

        (data || []).forEach((t) => {
          const totalFloors = Number(t.total_floors || 0);
          const unitsPerFloor = Number(t.units_per_floor || 0);
          const unitsCount = totalFloors * unitsPerFloor;

          map[t.tower_id] = {
            hasUnits: unitsCount > 0,
            unitsCount,
            total_floors: totalFloors,
            units_per_floor: unitsPerFloor,
          };
        });

        setExistingByTowerId(map);
      } catch (err) {
        console.error("LOAD TOWER CONFIGS ERROR:", err);
      }
    };

    loadConfigs();
  }, [societyId]);

  /* ---------------- LOAD EXISTING FLOOR/UNIT TYPES ---------------- */
  useEffect(() => {
    const loadExistingFloors = async () => {
      if (!societyId) return;

      try {
        const flats = await getFlatsBySociety(societyId);
        const byTower = {};

        (flats || []).forEach((f) => {
          const towerId = f.tower_id;
          const floorNo = Number(f.floor_number);
          if (!towerId || !floorNo) return;

          byTower[towerId] = byTower[towerId] || {};
          byTower[towerId][floorNo] = byTower[towerId][floorNo] || [];

          byTower[towerId][floorNo].push({
            flat_id: f.flat_id,
            number: String(f.flat_number),
            type: f.unit_type || "1BHK",
          });
        });

        const floorsMap = {};
        Object.keys(byTower).forEach((towerId) => {
          const floorsObj = byTower[towerId];
          const floorNumbers = Object.keys(floorsObj)
            .map((n) => Number(n))
            .filter(Boolean)
            .sort((a, b) => a - b);

          floorsMap[towerId] = floorNumbers.map((floorNo) => {
            const units = (floorsObj[floorNo] || []).sort((a, b) =>
              String(a.number).localeCompare(String(b.number), undefined, {
                numeric: true,
              })
            );

            const allSame =
              units.length > 0 && units.every((u) => u.type === units[0].type);

            return {
              floor: floorNo,
              units,
              defaultType: allSame ? units[0].type : "1BHK",
            };
          });
        });

        setExistingFloorsByTowerId(floorsMap);
      } catch (err) {
        console.error("LOAD FLATS ERROR:", err);
      }
    };

    loadExistingFloors();
  }, [societyId]);

  /* ---------------- GENERATE FLOORS ---------------- */
  const generateFloors = (floors, unitsPerFloor) => {
    return Array.from({ length: floors }, (_, i) => {
      const floorNo = i + 1;

      const units = Array.from({ length: unitsPerFloor }, (_, j) => ({
        number: `${floorNo}${String(j + 1).padStart(2, "0")}`,
        type: "1BHK",
      }));

      return {
        floor: floorNo,
        units,
        unitCount: unitsPerFloor, // ✅ important
        defaultType: "1BHK",
      };
    });
  };

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (index, field, value) => {
    if (readOnly) return;

    const tower = configs[index];
   if (tower?.hasExistingUnits) {
      // Allow editing ONLY via floor-level controls
      // but block global regeneration
      if (field === "total_floors" || field === "units_per_floor") {
        toast.info(
          `${tower.tower_name}: cannot regenerate. Edit floors individually.`
        );
        return;
      }
    }

    let clean = value.replace(/\D/g, "");

    if (clean === "") {
      setFieldError(tower?.tower_id, field, null);
      setConfigs((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, [field]: "", floorConfigs: [] } : c
        )
      );
      return;
    }

    if (field === "total_floors") {
      const numeric = Number(clean);
      if (numeric > MAX_FLOORS) {
        notifyLimit(tower.tower_id, tower.tower_name, field, MAX_FLOORS);
        setFieldError(
          tower.tower_id,
          field,
          `Cannot be greater than ${MAX_FLOORS}`
        );
      } else {
        setFieldError(tower.tower_id, field, null);
      }
      clean = Math.min(numeric, MAX_FLOORS).toString();
    }

    if (field === "units_per_floor") {
      const numeric = Number(clean);
      if (numeric > MAX_UNITS) {
        notifyLimit(tower.tower_id, tower.tower_name, field, MAX_UNITS);
        setFieldError(
          tower.tower_id,
          field,
          `Cannot be greater than ${MAX_UNITS}`
        );
      } else {
        setFieldError(tower.tower_id, field, null);
      }
      clean = Math.min(numeric, MAX_UNITS).toString();
    }

    setConfigs((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;

        const updated = { ...c, [field]: clean };
        const floors = Number(updated.total_floors);
        const units = Number(updated.units_per_floor);

        if (!floors || !units) {
          return { ...updated, floorConfigs: [] };
        }

        if (!c.floorConfigs || c.floorConfigs.length === 0) {
          return { ...updated, floorConfigs: generateFloors(floors, units) };
        }

        if (
          c.floorConfigs.length === floors &&
          c.floorConfigs[0]?.units?.length === units
        ) {
          return updated;
        }

        return { ...updated, floorConfigs: generateFloors(floors, units) };
      })
    );
  };

  /* ---------------- HANDLE CHANGE FOR THE UNIT COUNT ---------------- */

  const handleUnitCountChange = (towerIndex, floorIndex, value) => {
    const clean = Math.min(Number(value.replace(/\D/g, "") || 0), MAX_UNITS);

    setConfigs((prev) =>
      prev.map((tower, i) => {
        if (i !== towerIndex) return tower;

        return {
          ...tower,
          floorConfigs: tower.floorConfigs.map((floor, fIdx) => {
            if (fIdx !== floorIndex) return floor;

            const oldUnits = floor.units || [];
            let newUnits = [];

            if (clean > oldUnits.length) {
              // ✅ ADD units
              const extra = Array.from(
                { length: clean - oldUnits.length },
                (_, j) => {
                  const nextIndex = oldUnits.length + j + 1;
                  return {
                    number: `${floor.floor}${String(nextIndex).padStart(2, "0")}`,
                    type: floor.defaultType || "1BHK",
                  };
                }
              );
              newUnits = [...oldUnits, ...extra];
            } else {
              // ✅ REMOVE units
              newUnits = oldUnits.slice(0, clean);
            }

            return {
              ...floor,
              unitCount: clean,
              units: newUnits,
            };
          }),
        };
      })
    );
  };

  /* ---------------- FLOOR TYPE CHANGE ---------------- */
  const handleFloorTypeChange = (towerIndex, floorIndex, value) => {
    const tower = configs[towerIndex];
    const floorNo = tower?.floorConfigs?.[floorIndex]?.floor;
    if (
      readOnly ||
      (tower?.hasExistingUnits && !isFloorEditable(tower.tower_id, floorNo))
    )
      return;

    setConfigs((prev) =>
      prev.map((tower, i) => {
        if (i !== towerIndex) return tower;

        return {
          ...tower,
          floorConfigs: tower.floorConfigs.map((floor, fIdx) => {
            if (fIdx !== floorIndex) return floor;

            return {
              ...floor,
              defaultType: value,
              units: floor.units.map((u) => ({
                ...u,
                type: value,
              })),
            };
          }),
        };
      })
    );
  };

  /* ---------------- CHANGE UNIT ---------------- */
  const handleUnitChange = (towerIndex, floorIndex, unitIndex, value) => {
    const tower = configs[towerIndex];
    const floorNo = tower?.floorConfigs?.[floorIndex]?.floor;
    if (
      readOnly ||
      (tower?.hasExistingUnits && !isFloorEditable(tower.tower_id, floorNo))
    )
      return;

    setConfigs((prev) =>
      prev.map((tower, i) => {
        if (i !== towerIndex) return tower;

        return {
          ...tower,
          floorConfigs: tower.floorConfigs.map((floor, fIdx) => {
            if (fIdx !== floorIndex) return floor;

            return {
              ...floor,
              units: floor.units.map((u, uIdx) =>
                uIdx === unitIndex ? { ...u, type: value } : u
              ),
            };
          }),
        };
      })
    );
  };


  const handleSaveFloor = async (towerIndex, floorIndex) => {
  try {
    const tower = configs[towerIndex];
    const floor = tower.floorConfigs[floorIndex];
    const towerId = tower.tower_id;
    const floorNo = floor.floor;

    const original = existingFloorsByTowerId || {};
    const originalFloor =
      (original[towerId] || []).find((f) => f.floor === floorNo) || {
        units: [],
      };

    const oldUnits = originalFloor.units || [];
    const newUnits = floor.units || [];

    const typeUpdates = [];
    const structureUpdates = [];

    const oldByFlatId = new Map(
      oldUnits.filter((u) => u.flat_id).map((u) => [u.flat_id, u])
    );

    // TYPE UPDATE
    newUnits.forEach((u) => {
      if (!u.flat_id) return;

      const prev = oldByFlatId.get(u.flat_id);
      if (prev && prev.type !== u.type) {
        typeUpdates.push({
          flat_id: u.flat_id,
          unit_type: u.type,
        });
      }
    });

    // ADD
    if (newUnits.length > oldUnits.length) {
      const toAdd = newUnits.slice(oldUnits.length);

      toAdd.forEach((u) => {
        structureUpdates.push({
          action: "ADD",
          tower_id: towerId,
          floor_number: floorNo,
          flat_number: u.number,
          unit_type: u.type,
        });
      });
    }

    // REMOVE (fixed logic)
    if (newUnits.length < oldUnits.length) {
      const newFlatIds = new Set(
        newUnits.map((u) => u.flat_id).filter(Boolean)
      );

      const toRemove = oldUnits.filter(
        (u) => u.flat_id && !newFlatIds.has(u.flat_id)
      );

      toRemove.forEach((u) => {
        structureUpdates.push({
          action: "REMOVE",
          flat_id: u.flat_id,
        });
      });
    }

    // API CALLS
    if (typeUpdates.length > 0) {
      await bulkUpdateFlatUnitTypes(typeUpdates);
    }

    if (structureUpdates.length > 0) {
      await updateFlatStructure(structureUpdates);
    }

    toast.success(`Floor ${floorNo} updated`);

    // disable edit mode
    toggleFloorEdit(towerId, floorNo);

  } catch (err) {
    console.error(err);
    toast.error("Failed to update floor");
  }
};
  /* ---------------- SUBMIT ---------------- */
  // const handleSubmit = async () => {
  //   if (Object.keys(errors || {}).length > 0) {
  //     toast.error("Please fix validation errors before generating units.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // 1) Update unit types for edited existing floors
  //     const typeUpdates = [];
  //     const original = existingFloorsByTowerId || {};

  //     configs.forEach((tower) => {
  //       if (!tower?.hasExistingUnits) return;
  //       const towerId = tower.tower_id;

  //       (tower.floorConfigs || []).forEach((floor) => {
  //         const floorNo = floor.floor;
  //         if (!isFloorEditable(towerId, floorNo)) return;

  //         const originalFloor =
  //           (original[towerId] || []).find((f) => f.floor === floorNo) || null;
  //         const originalByFlatId = new Map(
  //           (originalFloor?.units || [])
  //             .filter((u) => u?.flat_id)
  //             .map((u) => [u.flat_id, u.type])
  //         );

  //         (floor.units || []).forEach((u) => {
  //           if (!u?.flat_id) return;
  //           const prevType = originalByFlatId.get(u.flat_id);
  //           if (!prevType) return;
  //           if (prevType !== u.type) {
  //             typeUpdates.push({ flat_id: u.flat_id, unit_type: u.type });
  //           }
  //         });
  //       });
  //     });

  //     if (typeUpdates.length > 0) {
  //       await bulkUpdateFlatUnitTypes(typeUpdates);
  //     }

  //     const payload = configs
  //       .filter((c) => !c.hasExistingUnits)
  //       .filter((c) => (c.floorConfigs || []).length > 0)
  //       .map((c) => ({
  //         tower_id: c.tower_id,
  //         floors: c.floorConfigs,
  //       }));

  //     if (payload.length === 0 && typeUpdates.length === 0) {
  //       toast.info("No new units to generate (towers may already have units).");
  //       return;
  //     }

  //     const skippedCount = configs.filter((c) => c.hasExistingUnits).length;
  //     if (skippedCount > 0) {
  //       toast.info(
  //         `Skipped ${skippedCount} tower(s) because units already exist.`
  //       );
  //     }

  //     if (payload.length > 0) {
  //       await generateUnits({ configs: payload });
  //     }
  //     onSuccess?.();
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleSubmit = async () => {
  if (Object.keys(errors || {}).length > 0) {
    toast.error("Please fix validation errors before saving.");
    return;
  }

  setLoading(true);

  try {
    const typeUpdates = [];
    const structureUpdates = [];
    const original = existingFloorsByTowerId || {};

    configs.forEach((tower) => {
      const towerId = tower.tower_id;

      (tower.floorConfigs || []).forEach((floor) => {
        const floorNo = floor.floor;

        // 🔒 Only editable floors
        if (tower.hasExistingUnits && !isFloorEditable(towerId, floorNo)) {
          return;
        }

        const originalFloor =
          (original[towerId] || []).find((f) => f.floor === floorNo) || {
            units: [],
          };

        const oldUnits = originalFloor.units || [];
        const newUnits = floor.units || [];

        const oldByFlatId = new Map(
          oldUnits
            .filter((u) => u.flat_id)
            .map((u) => [u.flat_id, u])
        );

        // ================= TYPE UPDATE =================
        newUnits.forEach((u) => {
          if (!u.flat_id) return;

          const prev = oldByFlatId.get(u.flat_id);

          if (prev && prev.type !== u.type) {
            typeUpdates.push({
              flat_id: u.flat_id,
              unit_type: u.type,
            });
          }
        });

        // ================= ADD UNITS =================
        if (newUnits.length > oldUnits.length) {
          const toAdd = newUnits.slice(oldUnits.length);

          toAdd.forEach((u) => {
            structureUpdates.push({
              action: "ADD",
              tower_id: towerId,
              floor_number: floorNo,
              flat_number: u.number,
              unit_type: u.type,
            });
          });
        }

        // ================= REMOVE UNITS =================
        if (newUnits.length < oldUnits.length) {
        const newFlatIds = new Set(
          newUnits.map((u) => u.flat_id).filter(Boolean)
        );

        const toRemove = oldUnits.filter(
          (u) => u.flat_id && !newFlatIds.has(u.flat_id)
        );

        toRemove.forEach((u) => {
          structureUpdates.push({
            action: "REMOVE",
            flat_id: u.flat_id,
          });
        });
      }
      });
    });

    // ================= API CALLS =================

    if (typeUpdates.length > 0) {
      await bulkUpdateFlatUnitTypes(typeUpdates);
    }

    if (structureUpdates.length > 0) {
      await updateFlatStructure(structureUpdates);
    }

    // ================= NEW TOWERS =================
    const payload = configs
      .filter((c) => !c.hasExistingUnits)
      .filter((c) => (c.floorConfigs || []).length > 0)
      .map((c) => ({
        tower_id: c.tower_id,
        floors: c.floorConfigs,
      }));

    if (payload.length > 0) {
      await generateUnits({ configs: payload });
    }

    // ================= NO CHANGE =================
    if (
      payload.length === 0 &&
      typeUpdates.length === 0 &&
      structureUpdates.length === 0
    ) {
      toast.info("No changes detected.");
      return;
    }

    toast.success("Units updated successfully");
    onSuccess?.();

  } catch (err) {
    console.error(err);
    toast.error("Update failed");
  } finally {
    setLoading(false);
  }
};
  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col gap-4">
      {configs.map((c, i) => (
        <div key={c.tower_id || i} className="border p-4 rounded bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{c.tower_name}</h4>
            {c.hasExistingUnits && (
              <span className="text-xs text-gray-600">
                Units already exist ({c.existingUnitsCount})
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Total Floors"
              value={c.total_floors}
              maxLength={3}
              onChange={(e) =>
                handleChange(i, "total_floors", e.target.value)
              }
              disabled={readOnly || c.hasExistingUnits}
              error={errors?.[c.tower_id]?.total_floors}
              containerClassName="w-1/2"
            />

            <Input
              placeholder="Units per Floor"
              maxLength={2}
              value={c.units_per_floor}
              onChange={(e) =>
                handleChange(i, "units_per_floor", e.target.value)
              }
              disabled={readOnly || c.hasExistingUnits}
              error={errors?.[c.tower_id]?.units_per_floor}
              containerClassName="w-1/2"
            />
          </div>

          {c.floorConfigs.length > 0 && (
            <div className="mt-4 border-t pt-3">
              {c.floorConfigs.map((floor, fIndex) => (
                <div
  key={fIndex}
  className="mb-4 border rounded-lg bg-gray-100 p-4"
>
  {/* HEADER */}
  <div className="flex items-center justify-between mb-3">
    <p className="font-semibold text-sm">
      Floor {floor.floor}
    </p>

    {c.hasExistingUnits && !readOnly && (
      <button
        type="button"
        onClick={() =>
          toggleFloorEdit(c.tower_id, floor.floor, i, fIndex)
        }
        className="p-1.5 rounded hover:bg-gray-200 transition"
      >
        {isFloorEditable(c.tower_id, floor.floor) ? (
          <X className="w-4 h-4 text-red-500" />
        ) : (
          <Pencil className="w-4 h-4 text-gray-500" />
        )}
      </button>
    )}
  </div>

  {/* CONTROLS */}
  <div className="flex items-center gap-6 mb-3">
    {/* Default */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Default</span>
      <Dropdown
        value={floor.defaultType}
        onChange={(value) =>
          handleFloorTypeChange(i, fIndex, value)
        }
        options={UNIT_OPTIONS}
        disabled={
          readOnly ||
          (c.hasExistingUnits &&
            !isFloorEditable(c.tower_id, floor.floor))
        }
        className="w-[90px]"
      />
    </div>

    {/* Units */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Units</span>
      <Input
        type="number"
        value={floor.unitCount ?? floor.units.length}
        onChange={(e) => {
          let val = e.target.value.replace(/\D/g, "");
          if (Number(val) > MAX_UNITS) val = MAX_UNITS;
          handleUnitCountChange(i, fIndex, val);
        }}
        className="w-[100px] text-center"
        disabled={
          readOnly ||
          (c.hasExistingUnits &&
            !isFloorEditable(c.tower_id, floor.floor))
        }
      />
    </div>
  </div>

  <hr className="mb-3 border-gray-200" />

  {/* UNITS GRID */}
  <div className="grid grid-cols-4 gap-3">
    {floor.units.map((unit, uIndex) => (
      <div
        key={uIndex}
        className="flex items-center justify-between border rounded-md bg-white shadow-sm"
      >
        <span className="text-sm text-gray-700 p-2">
          {unit.number}
        </span>

        <Dropdown
          value={unit.type}
          onChange={(value) =>
            handleUnitChange(i, fIndex, uIndex, value)
          }
          options={UNIT_OPTIONS}
          disabled={
            readOnly ||
            (c.hasExistingUnits &&
              !isFloorEditable(c.tower_id, floor.floor))
          }
          className="text-xs border-0 bg-transparent"
        />
      </div>
    ))}
  </div>

  {/* SAVE BUTTON */}
  {isFloorEditable(c.tower_id, floor.floor) && (
    <div className="flex justify-end mt-4">
      <Button
        size="sm"
        onClick={() => handleSaveFloor(i, fIndex)}
      >
        Save
      </Button>
    </div>
  )}
</div>
              ))}
            </div>
          )}

        </div>
      ))}

      <div className="flex gap-2">
        {!!onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}

        <Button onClick={handleSubmit} loading={loading}>
          Generate Units
        </Button>
      </div>
    </div>
  );
};

export default UnitForm;
