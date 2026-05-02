import { useState, useEffect } from "react";
import SocietyForm from "./SocietyForm";
import TowerForm from "./TowerForm";
import UnitForm from "./UnitForm";
import { getTowersBySociety } from "../../services/societyService";
import Spinner from "../ui/Spinner";

const SocietyWizard = ({
  society = null,
  readOnly = false,
  onComplete,
}) => {
  /* ---------------- STATE ---------------- */
  const [step, setStep] = useState(society ? 2 : 1); // ✅ edit starts at towers
  const [societyId, setSocietyId] = useState(
    society?.society_id || null
  );
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD TOWERS (EDIT MODE) ---------------- */
  useEffect(() => {
    const loadTowers = async () => {
      try {
        if (!societyId) return;

        setLoading(true);
        const data = await getTowersBySociety(societyId);

        setTowers(data || []);
      } catch (err) {
        console.error("LOAD TOWERS ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    if (societyId && (society || readOnly)) {
      loadTowers();
    }
  }, [societyId, society, readOnly]);

  return (
    <div className="flex flex-col gap-4">

      {/* STEP HEADER */}
      <div className="flex justify-between text-sm mb-2">
        <span className={step === 1 ? "font-bold" : ""}>1. Society</span>
        <span className={step === 2 ? "font-bold" : ""}>2. Towers</span>
        <span className={step === 3 ? "font-bold" : ""}>3. Units</span>
      </div>

      {/* ---------------- STEP 1 ---------------- */}
      {step === 1 && (
        <SocietyForm
          society={society}
          readOnly={readOnly}
          onSuccess={(id) => {
            setSocietyId(id);
            setStep(2);
          }}
        />
      )}

      {/* ---------------- STEP 2 ---------------- */}
      {step === 2 && (
        <TowerForm
          societyId={societyId}
          towers={towers}              // ✅ pass existing towers
          readOnly={readOnly}
          onSuccess={(towerList) => {
            setTowers(towerList);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {/* ---------------- STEP 3 ---------------- */}
      {step === 3 && (
        loading ? (
          <div className="p-6 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (          
          <UnitForm
            towers={towers}
            societyId={societyId}
            readOnly={readOnly}
            mode={society ? "edit" : "create"}
            onBack={() => setStep(2)}
            onSuccess={onComplete}
          />
        )
      )}

    </div>
  );
};

export default SocietyWizard;
