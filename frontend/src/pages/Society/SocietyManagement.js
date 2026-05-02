import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";

import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import Modal from "../../components/ui/Modal";
import SocietyForm from "../../components/societies/SocietyForm";
import Spinner from "../../components/ui/Spinner";

import {
  getSocieties,
  deleteSociety,
} from "../../services/societyService";

const ALLOWED_DELETE_ROLES = ["Super Admin", "Admin"];

const SocietyManagement = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentUserRole, setCurrentUserRole] = useState(null);

  /* ---------------- ROLE ---------------- */
  const getCurrentUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("myasmita:auth-user"));
      return user?.user_type || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setCurrentUserRole(getCurrentUserRole());
  }, []);

  const canDelete = useMemo(() => {
    return ALLOWED_DELETE_ROLES.includes(currentUserRole);
  }, [currentUserRole]);

  /* ---------------- SEARCH DEBOUNCE ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- FETCH ---------------- */
  const fetchSocieties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSocieties(debouncedSearch);
      setSocieties(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch societies");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);

  /* ---------------- HANDLERS ---------------- */
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
    if (!canDelete) {
      toast.error("You are not allowed to delete societies");
      return;
    }

    if (!window.confirm("Deactivate this society?")) return;

    try {
      await deleteSociety(row.society_id);
      toast.success("Society deactivated");
      fetchSocieties();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      header: "Sr No",
      render: (_, index) => index + 1,
    },
    {
      header: "Society Name",
      accessor: "society_name",
    },
    {
      header: "City",
      accessor: "city",
    },
    {
      header: "Location",
      render: (row) => {
        if (row.latitude && row.longitude) {
          return (
            <a
              href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View Map
            </a>
          );
        }

        if (row.google_map_url) {
          return (
            <a
              href={row.google_map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Open Link
            </a>
          );
        }

        return <span className="text-gray-400">N/A</span>;
      },
    },
    {
      header: "Address",
      accessor: "address",
    },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          showEdit
          showView
          showDelete={canDelete}
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
          <input
            type="text"
            placeholder="Search society..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64"
          />
        }
        actions={
          <Button variant="danger" onClick={handleAdd}>
            + ADD SOCIETY
          </Button>
        }
      >
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <DataTable columns={columns} data={societies} />
        )}
      </DataTableLayout>

      {/* MODAL */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={
          selected
            ? viewMode
              ? "View Society"
              : "Edit Society"
            : "Setup Society"
        }
      >
        <SocietyForm
          society={selected}
          readOnly={viewMode}
          onSuccess={() => {
            setOpenModal(false);
            fetchSocieties();
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default SocietyManagement;
