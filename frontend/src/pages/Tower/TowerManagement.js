import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import DataTable from "../../components/common/DataTable";
import DataTableLayout from "../../layouts/DataTableLayout";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TowerForm from "../../components/societies/TowerForm";
import ActionButtons from "../../components/common/ActionButtons";
import { toast } from "react-toastify";
import Spinner from "../../components/ui/Spinner";

import { deleteTower, getTowersBySociety, getSocieties } from "../../services/societyService";

const TowerManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSocietyId = searchParams.get("societyId") || "";
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch societies for the dropdown
  const fetchSocieties = useCallback(async () => {
    try {
      const data = await getSocieties();
      setSocieties(data || []);
      if ((!selectedSocietyId || selectedSocietyId === "null") && data && data.length > 0) {
        setSearchParams({ societyId: String(data[0].society_id) });
      }
    } catch (err) {
      console.error("Error fetching societies:", err);
    }
  }, [selectedSocietyId, setSearchParams]);

  const fetchTowers = useCallback(async () => {
    if (!selectedSocietyId) {
      setTowers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getTowersBySociety(selectedSocietyId);
      setTowers(data || []);
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
    if (selectedSocietyId) fetchTowers();
  }, [selectedSocietyId, fetchTowers]);

  const handleSocietyChange = (e) => {
    setSearchParams({ societyId: e.target.value });
  };

  const selectedSocietyName = useMemo(() => {
    const match = societies.find((s) => String(s.society_id) === String(selectedSocietyId));
    return match?.society_name || "";
  }, [societies, selectedSocietyId]);

  const columns = [
    {
      header: "Sr No",
      render: (_, i) => i + 1,
    },
    {
      header: "Tower Name",
      accessor: "tower_name",
    },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          showEdit={false}
          showView={false}
          showDelete
          deleteLabel="Delete"
          onDelete={async () => {
            if (!window.confirm("Delete this tower? This also deletes floors and units.")) return;
            try {
              await deleteTower(row.tower_id);
              toast.success("Tower deleted");
              fetchTowers();
            } catch (err) {
              console.error(err);
            }
          }}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title={`Tower Management${selectedSocietyName ? ` - ${selectedSocietyName}` : ""}`}
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
            + Manage Towers
          </Button>
        }
      >
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <DataTable columns={columns} data={towers} />
        )}
      </DataTableLayout>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Manage Towers"
      >
        <TowerForm
          societyId={selectedSocietyId}
          towers={towers}
          onSuccess={() => {
            setOpen(false);
            fetchTowers();
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default TowerManagement;
