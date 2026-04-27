import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import ActionButtons from "../../components/common/ActionButtons";
import FilterBar from "../../components/common/FilterBar";
import Modal from "../../components/ui/Modal";

import { getSocieties } from "../../services/societyService";

const ServiceUsed = () => {
  /* ---------------- STATE ---------------- */
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const [filters, setFilters] = useState({ search: "" });
  const [appliedFilters, setAppliedFilters] = useState({ search: "" });

  /* ---------------- FETCH ---------------- */
  const fetchServices = async () => {
    try {
      const data = await getSocieties(); // ⚠ replace with getServices later
      setServices(data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredData = services.filter((item) => {
    const search = appliedFilters.search.toLowerCase();

    return (
      !search ||
      item.service_provider_name?.toLowerCase().includes(search) ||
      item.society_name?.toLowerCase().includes(search) ||
      item.service_name?.toLowerCase().includes(search)
    );
  });

  /* ---------------- HANDLERS ---------------- */
  const handleView = (row) => {
    setSelected(row);
    setViewMode(true);
    setOpenModal(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const empty = { search: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      header: "Sr No",
      render: (_, index) => index + 1,
    },
    { header: "Service Provider Name", accessor: "service_provider_name" },
    { header: "Society Name", accessor: "society_name" },
    { header: "Service Name", accessor: "service_name" },
    { header: "Used By", accessor: "used_by" },
    { header: "Provider", accessor: "provider" },
    { header: "Phone", accessor: "phone" },
    { header: "Date & Time", accessor: "datetime" },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons row={row} onView={handleView} />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title="Society Services"
        filters={
          <FilterBar
            filtersConfig={[
              {
                key: "search",
                label: "Search",
                type: "text",
                placeholder: "Search services...",
              },
            ]}
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">
            Loading Service Providers...
          </p>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </DataTableLayout>

      {/* ---------------- MODAL ---------------- */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="View Service"
      >
        {selected && (
          <div className="space-y-2 text-sm">
            <p><b>Provider:</b> {selected.service_provider_name}</p>
            <p><b>Society:</b> {selected.society_name}</p>
            <p><b>Service:</b> {selected.service_name}</p>
            <p><b>Used By:</b> {selected.used_by}</p>
            <p><b>Phone:</b> {selected.phone}</p>
            <p><b>Date:</b> {selected.datetime}</p>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default ServiceUsed;