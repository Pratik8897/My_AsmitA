import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { createTowers } from "../../services/societyService";
import { toast } from "react-toastify";

const TowerForm = ({
  societyId,
  towers = [],
  readOnly = false,
  onSuccess,
  onBack,
}) => {
  const [towerList, setTowerList] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🔥 PREFILL */
  useEffect(() => {
    if (towers?.length) {
      setTowerList(towers.map((t) => t.tower_name));
    } else {
      setTowerList([""]);
    }
  }, [towers]);

  const handleTowerChange = (i, val) => {
    const updated = [...towerList];
    updated[i] = val;
    setTowerList(updated);
  };

  const addTower = () => {
    setTowerList([...towerList, ""]);
  };

  const removeTower = (i) => {
    if (towerList.length === 1) {
      toast.error("At least one tower required");
      return;
    }
    setTowerList(towerList.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const valid = towerList.filter((t) => t.trim());
    if (!valid.length) {
      toast.error("Add at least one tower");
      return;
    }

    try {
      setLoading(true);

      const res = await createTowers({
        society_id: societyId,
        towers: valid,
      });

      onSuccess(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <h3 className="font-semibold">
        {readOnly ? "View Towers" : "Edit Towers"}
      </h3>

      {towerList.map((t, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-6">{i + 1}</span>

          <input
            value={t}
            disabled={readOnly}
            onChange={(e) => handleTowerChange(i, e.target.value)}
            className="input flex-1"
          />

          {!readOnly && towerList.length > 1 && (
            <button type="button" onClick={() => removeTower(i)}>
              ✕
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <Button type="button" onClick={addTower}>
          + Add Tower
        </Button>
      )}

      <div className="flex gap-2">
        {!!onBack && (
          <Button type="button" onClick={onBack}>
            Back
          </Button>
        )}

        {!readOnly && (
          <Button type="submit" loading={loading}>
            Save Towers
          </Button>
        )}
      </div>
    </form>
  );
};

export default TowerForm;
