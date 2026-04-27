import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import FilterBar from "../../components/common/FilterBar";
import Modal from "../../components/ui/Modal";

import {
  getSocieties,
  deleteSociety,
} from "../../services/societyService";
import AddFaq from "../FAQ/AddFaq";

const Support = () => {
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

  // 🔥 GLOBAL TAB STATE (IMPORTANT CHANGE)
  const [activeTab, setActiveTab] = useState("faq"); // "faq" | "support"

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
      item.Service?.toLowerCase().includes(search) ||
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
    if (!window.confirm("Deactivate this society?")) return;

    try {
      await deleteSociety(row.society_id);
      fetchSocieties();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 FILTER APPLY
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const empty = { search: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  // 🔥 DYNAMIC COLUMNS BASED ON TAB
  const columns = [
    {
      header: "Sr No",
      render: (_, index) => index + 1,
    },

    {
      header: activeTab === "faq" ? "FAQ" : "Support",
      render: (row) => (
        <div className="text-sm text-gray-700">
          {activeTab === "faq"
            ? row.faq_content || "No FAQ available"
            : row.support_content || "No Support available"}
        </div>
      ),
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
        title="Society Services"
        
        // 🔥 TOP TAB SWITCH UI
        filters={
          <div className="flex gap-2 mb-3">
            

            {/* existing filter */}
            <div className="ml-auto">
              <FilterBar
                filtersConfig={[
                  {
                    key: "search",
                    label: "Search",
                    type: "text",
                    placeholder: "Search society...",
                  },
                ]}
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </div>
          </div>
        }
        actions={
          <Button variant="danger" onClick={handleAdd}>
            + ADD NEW FAQ
          </Button>
        }
      >


          <button
              onClick={() => setActiveTab("faq")}
              className={`px-4 py-2 rounded ${
                activeTab === "faq"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              FAQ
            </button>

            <button
              onClick={() => setActiveTab("support")}
              className={`px-4 py-2 rounded ${
                activeTab === "support"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              Support
            </button>
    
        {loading ? (
          <p className="p-4 text-gray-500">
            Loading Services Providers...
          </p>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}

        
      </DataTableLayout>

      {/* MODAL */}

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

        <AddFaq
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

export default Support;