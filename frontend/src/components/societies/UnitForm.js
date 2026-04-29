import { useState, useEffect } from "react";
import Button from "../ui/Button";
import {
  generateUnits,
  getTowerConfigs,
} from "../../services/societyService";
import { toast } from "react-toastify";

const UnitForm = ({
  towers = [],
  societyId,
  readOnly = false,
  mode = "create",
  onBack,
  onSuccess,
}) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- INIT (CREATE MODE) ---------------- */
  useEffect(() => {
    if (!towers?.length) {
      setConfigs([]);
      return;
    }

    if (mode === "create") {
      setConfigs(
        towers.map((t) => ({
          tower_id: t.tower_id,
          tower_name: t.tower_name,
          total_floors: "",
          units_per_floor: "",
          unit_types_csv: "",
        }))
      );
    }
  }, [towers, mode]);

  /* ---------------- PREFILL (EDIT / VIEW MODE) ---------------- */
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        if (!towers?.length || !societyId) return;

        const data = await getTowerConfigs(societyId);
        const towerConfigs = data?.towers || [];

        // ✅ fallback if no config found
        if (!towerConfigs || towerConfigs.length === 0) {
          setConfigs(
            towers.map((t) => ({
              tower_id: t.tower_id,
              tower_name: t.tower_name,
              total_floors: "",
              units_per_floor: "",
            }))
          );
          return;
        }

        const mapped = towerConfigs.map((t) => ({
          tower_id: t.tower_id,
          tower_name: t.tower_name,
          total_floors: t.total_floors || "",
          units_per_floor: t.units_per_floor || "",
          unit_types_csv: "",
        }));

        setConfigs(mapped);
      } catch (err) {
        console.error("CONFIG LOAD ERROR:", err);
      }
    };

    if (mode === "edit" || readOnly) {
      loadConfigs();
    }
  }, [towers, societyId, mode, readOnly]);

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (index, field, value) => {
    if (readOnly) return;

    const clean = field === "unit_types_csv" ? value : value.replace(/\D/g, "");

    setConfigs((prev) => {
      const updated = [...prev];
      updated[index][field] = clean;
      return updated;
    });
  };

  /* ---------------- REMOVE ---------------- */
  const handleRemoveTower = (index) => {
    if (readOnly) return;

    if (configs.length === 1) {
      toast.error("At least one tower is required");
      return;
    }

    setConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (readOnly) return;

    if (!configs.length) {
      toast.error("No towers available");
      return;
    }

    if (mode === "edit") {
      const confirm = window.confirm(
        "This will overwrite existing flats. Continue?"
      );
      if (!confirm) return;
    }

    for (const c of configs) {
      if (!c.total_floors || !c.units_per_floor) {
        toast.error(`Fill all fields for ${c.tower_name}`);
        return;
      }

      if (
        Number(c.total_floors) <= 0 ||
        Number(c.units_per_floor) <= 0
      ) {
        toast.error(`Invalid values in ${c.tower_name}`);
        return;
      }

      if (c.unit_types_csv?.trim()) {
        const types = c.unit_types_csv
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        if (types.length !== Number(c.units_per_floor)) {
          toast.error(
            `${c.tower_name}: Unit types count must match units per floor (${c.units_per_floor})`
          );
          return;
        }

        const allowed = new Set(["1BHK", "2BHK", "3BHK"]);
        const invalid = types.find((t) => !allowed.has(t));
        if (invalid) {
          toast.error(
            `${c.tower_name}: Invalid unit type "${invalid}". Use 1BHK, 2BHK, 3BHK`
          );
          return;
        }
      }
    }

    try {
      setLoading(true);

      const payload = configs.map((c) => {
        const unitTypes = c.unit_types_csv?.trim()
          ? c.unit_types_csv
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined;

        return {
          tower_id: c.tower_id,
          total_floors: Number(c.total_floors),
          units_per_floor: Number(c.units_per_floor),
          ...(unitTypes ? { unit_types: unitTypes } : {}),
        };
      });

      await generateUnits({ configs: payload });

      toast.success("Units generated successfully");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate units");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EMPTY ---------------- */
  if (!configs.length) {
    return <p className="text-gray-500">No towers available</p>;
  }

  return (
    <div className="flex flex-col gap-4">

      {mode === "edit" && !readOnly && (
        <div className="p-3 rounded bg-yellow-100 text-yellow-800 text-sm border border-yellow-300">
          ⚠ Generating units will overwrite existing flats.
        </div>
      )}

      {configs.map((c, i) => (
        <div
          key={c.tower_id || i}
          className="border p-4 rounded-lg shadow-sm bg-white"
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-700">
              {c.tower_name}
            </h4>

            {!readOnly && configs.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveTower(i)}
                className="text-red-500 text-lg font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Total Floors"
              value={c.total_floors}
              disabled={readOnly}
              onChange={(e) =>
                handleChange(i, "total_floors", e.target.value)
              }
              className="input w-1/2"
            />

            <input
              type="text"
              placeholder="Units per Floor"
              value={c.units_per_floor}
              disabled={readOnly}
              onChange={(e) =>
                handleChange(i, "units_per_floor", e.target.value)
              }
              className="input w-1/2"
            />
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder='Unit types (optional): e.g. "1BHK,2BHK,3BHK"'
              value={c.unit_types_csv || ""}
              disabled={readOnly}
              onChange={(e) =>
                handleChange(i, "unit_types_csv", e.target.value)
              }
              className="input w-full"
            />
            <div className="text-[11px] text-gray-500 mt-1">
              Enter exactly {c.units_per_floor || "N"} values (comma-separated) to set per-floor unit types by position.
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        {!!onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}

        {!readOnly && (
          <Button onClick={handleSubmit} loading={loading}>
            Generate Units
          </Button>
        )}
      </div>
    </div>
  );
};

export default UnitForm;
