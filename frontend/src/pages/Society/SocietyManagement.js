import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import FilterBar from "../../components/common/FilterBar";
import Modal from "../../components/ui/Modal";
import SocietyForm from "../../components/societies/SocietyForm";

import {
  getSocieties,
  deleteSociety,
} from "../../services/societyService";

const SocietyManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // 🔥 FILTER STATE
  const [filters, setFilters] = useState({
    search: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
  });

  // 🔹 FETCH DATA
  const fetchSocieties = async () => {
    try {
      const data = await getSocieties();
      setSocieties(data);
    } catch (err) {
      console.error("Error fetching societies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  // 🔹 FILTER LOGIC
  const filteredData = societies.filter((item) => {
    const search = appliedFilters.search.toLowerCase();

    return (
      !search ||
      item.society_name?.toLowerCase().includes(search) ||
      item.address?.toLowerCase().includes(search)
    );
  });

  // 🔹 HANDLERS
  const handleAdd = () => {
    setSelected(null);
    setViewMode(false);
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    setSelected(row);
    setViewMode(false);
    setOpenModal(true);
  };

  const handleView = (row) => {
    setSelected(row);
    setViewMode(true);
    setOpenModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Deactivate this society?")) return;

    try {
      await deleteSociety(row.society_id);
      fetchSocieties(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 APPLY FILTER
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const empty = { search: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  // 🔹 COLUMNS
  const columns = [
    {
      header: "Sr No",
      render: (_, index) => index + 1,
    },
    { header: "Society Name", accessor: "society_name" },
    { header: "Address", accessor: "address" },
    {
      header: "Google Location",
      accessor: "google_pin_location",
    },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          deleteLabel="Deactivate Society"
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title="Society Management"

        filters={
          <FilterBar
            filtersConfig={[
              {
                key: "search",
                label: "Search",
                type: "text",
                placeholder: "Search society..."
              },
            ]}
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        }

        actions={
          <Button variant="danger" onClick={handleAdd}>
            + ADD SOCIETY
          </Button>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading societies...</p>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </DataTableLayout>

      {/* 🔥 MODAL */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={
          viewMode
            ? "View Society"
            : selected
            ? "Edit Society"
            : "Add Society"
        }
      >
        <SocietyForm
          society={selected}
          readOnly={viewMode}
          onSuccess={() => {
            setOpenModal(false);
            fetchSocieties(); // refresh
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default SocietyManagement;