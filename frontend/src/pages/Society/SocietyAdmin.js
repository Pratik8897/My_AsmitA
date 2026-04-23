import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import FilterBar from "../../components/common/FilterBar";
import Modal from "../../components/ui/Modal";
// import SocietyForm from "../../components/societies/SocietyForm";
import SocietyAdminForm from "../../components/societies/SocietyAdminForm";

import {
  getSocietyAdmins,
  deleteSocietyAdmin,
} from "../../services/SocietyAdminServices";
import { getSocieties } from "../../services/societyService";

const SocietyAdmin = () => {
  const [societies, setSocieties] = useState([]);
  const [availableSocieties, setAvailableSocieties] = useState([]);
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
      const data = await getSocietyAdmins();
      setSocieties(data);
    } catch (err) {
      console.error("Error fetching societies:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSocieties = async () => {
    try {
      const data = await getSocieties();
      setAvailableSocieties(data);
    } catch (err) {
      console.error("Error fetching available societies:", err);
    }
  };

  useEffect(() => {
    fetchSocieties();
    fetchAvailableSocieties();
  }, []);

  // 🔹 FILTER LOGIC
  const filteredData = societies.filter((item) => {
    // console.log("Filtering data Item:", item); // Debug log to check item structure
    const search = appliedFilters.search.toLowerCase();

    return (
      !search ||
      item.society_admin_name?.toLowerCase().includes(search) ||
      item.society_name?.toLowerCase().includes(search)
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
    if (!window.confirm("Deactivate this society admin?")) return;

    try {
      await deleteSocietyAdmin(row.user_id);
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
    { header: "Society Admin Name", accessor: "society_admin_name" },
    { header: "Society Name", accessor: "society_name" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          deleteLabel="Deactivate Society Admin"
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title="Society Admin"

        filters={
          <FilterBar
            filtersConfig={[
              {
                key: "search",
                label: "Search",
                type: "text",
                placeholder: "Search society admin..."
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
            + ADD SOCIETY ADMIN
          </Button>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading society admins...</p>
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
            ? "View Society Admin"
            : selected
            ? "Edit Society Admin"
            : "Add Society Admin"
        }
      >
        <SocietyAdminForm
          society={selected}
          societies={availableSocieties}
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

export default SocietyAdmin;
