<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
>>>>>>> abdul_my_pages
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";


import AdminLayout from "../layouts/AdminLayout";
import DataTableLayout from "../layouts/DataTableLayout";
import DataTable from "../components/common/DataTable";

import Button from "../components/ui/Button";
import ActionButtons from "../components/common/ActionButtons";
import FilterBar from "../components/common/FilterBar";
import Modal from "../components/ui/Modal";
import SocietyForm from "../components/societies/SocietyForm";
import {
  deleteSociety,
  getSocieties,
} from "../services/societyService";

const SocietyManagement = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [filters, setFilters] = useState({
    address: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    address: [],
  });

  const fetchSocieties = async () => {
    try {
      const data = await getSocieties();
      setSocieties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const addressOptions = Array.from(
    new Set(
      societies
        .map((society) => society.address)
        .filter(Boolean)
    )
  );

  const filtersConfig = [
    {
      key: "address",
      label: "Address",
      options: addressOptions,
    },
  ];

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const empty = { address: [] };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const filteredData = societies.filter((item) => {
    return (
      appliedFilters.address.length === 0 ||
      appliedFilters.address.includes(item.address)
    );
  });

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
            filtersConfig={filtersConfig}
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        }
        actions={
          <>
            <Button onClick={() => navigate("/add-society")}>
              + Add Society
            </Button>

            <Button variant="primary">
              Export Data In Excel
            </Button>
          </>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading societies...</p>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </DataTableLayout>

<<<<<<< HEAD
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
            setSelected(null);
            fetchSocieties();
          }}
        />
      </Modal>
=======
          <button className="btn outline" type="button">
            Export Data In Excel
          </button>
        </div>



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Society Management</h2>
              <button
                className="filter-toggle"
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                aria-expanded={showFilters}
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>



    

            <div className="user-search">
              <span className="search-icon" aria-hidden="true" />
              <input placeholder="Search by name" />
            </div>

          </div>

          {/* Table */}
          <div className="user-table">
            <table>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Society</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                  <th>Name</th>
                  <th>Email ID</th>
                  <th>Phone Number</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society">{user.society}</td>
                    <td data-label="City">{user.city}</td>
                    <td data-label="State">{user.state}</td>
                    <td data-label="Country">{user.country}</td>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Email ID">{user.email}</td>
                    <td data-label="Phone Number">{user.phone}</td>

                    <td data-label="Action">
                      <div className="action-group">
                        <button
                          className="icon-btn edit"
                          type="button"
                          aria-label="Edit"
                        />
                        <button
                          className="icon-btn delete"
                          type="button"
                          aria-label="Delete"
                        />
                        <button className="view-btn" type="button">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>
>>>>>>> abdul_my_pages
    </AdminLayout>
  );
};

export default SocietyManagement;
