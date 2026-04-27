import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import FilterBar from "../../components/common/FilterBar";
import Modal from "../../components/ui/Modal";
import AddAmenity from "../../pages/Amenities/AddAmenity";

import {
  getSocieties,
  deleteSociety,
} from "../../services/societyService";

const Amenities = () => {
  const [amenities, setAmenities] = useState([]);
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
  const fetchAmenities = async () => {
    try {
      const data = await getSocieties(); // ⚠️ replace with getAmenities() if API exists
      setAmenities(data);
    } catch (err) {
      console.error("Error fetching amenities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  // 🔹 FILTER LOGIC
  const filteredData = amenities.filter((item) => {
    const search = appliedFilters.search.toLowerCase();

    return (
      !search ||
      (item.amenity || "").toLowerCase().includes(search)
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
    if (!window.confirm("Deactivate this amenity?")) return;

    try {
      await deleteSociety(row.society_id); // ⚠️ replace with deleteAmenity if available
      fetchAmenities();
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
    {
      header: "Amenity",
      accessor: "amenity",
    },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          deleteLabel="Deactivate Amenity"
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title="Amenities"
        filters={
          <FilterBar
            filtersConfig={[
              {
                key: "search",
                label: "Search",
                type: "text",
                placeholder: "Search amenity...",
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
            + ADD AMENITY
          </Button>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading Amenities...</p>
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
            ? "View Amenity"
            : selected
            ? "Edit Amenity"
            : "Add Amenity"
        }
      >
        <AddAmenity
          amenity={selected} // ⚠️ rename to amenity if you update form
          society={selected} // ⚠️ rename to amenity if you update form
          readOnly={viewMode}
          onSuccess={() => {
            setOpenModal(false);
            fetchAmenities();
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default Amenities;