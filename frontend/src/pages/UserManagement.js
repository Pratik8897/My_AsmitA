import { useEffect, useState } from "react";
import "./UserManagement.css";

import AdminLayout from "../layouts/AdminLayout";
import DataTableLayout from "../layouts/DataTableLayout";
import DataTable from "../components/common/DataTable";

import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import ActionButtons from "../components/common/ActionButtons";

import Modal from "../components/ui/Modal";
import UserForm from "../components/users/UserForm";
import FilterBar from "../components/common/FilterBar";

import {
  getUsers,
  deleteUser,
  getUserStats,
} from "../services/userService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // 🔥 MULTI FILTER STATE
  const [filters, setFilters] = useState({
    os_type: [],
    user_type: [],
  });

  const [appliedFilters, setAppliedFilters] = useState({
    os_type: [],
    user_type: [],
  });

  // 🔥 STATS
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // 🔥 FILTER CONFIG
  const filtersConfig = [
    {
      key: "os_type",
      label: "OS Type",
      options: ["Android", "iOS"],
    },
    {
      key: "user_type",
      label: "User Type",
      options: ["Owner", "Tenant", "Super Admin", "Society Admin"],
    },
  ];

  // 🔹 Fetch Users
  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await getUserStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // 🔥 APPLY FILTERS
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  // 🔥 CLEAR FILTERS
  const handleClearFilters = () => {
    const empty = { os_type: [], user_type: [] };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  // 🔥 FILTER LOGIC (FINAL FIX)
  const filteredUsers = users.filter((user) => {
    return (
      (appliedFilters.os_type.length === 0 ||
        appliedFilters.os_type.includes(user.os_type)) &&
      (appliedFilters.user_type.length === 0 ||
        appliedFilters.user_type.includes(user.user_type))
    );
  });

  // 🔹 Handlers
  const handleDelete = async (row) => {
    if (!window.confirm("Deactivate this user?")) return;

    try {
      await deleteUser(row.user_id);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (row) => {
    setSelectedUser(row);
    setViewMode(false);
    setOpenModal(true);
  };

  const handleView = (row) => {
    setSelectedUser(row);
    setViewMode(true);
    setOpenModal(true);
  };

  // 🔹 Columns
  const columns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email ID", accessor: "email_id" },
    { header: "Phone Number", accessor: "mobile_number" },
    { header: "Gender", accessor: "gender" },
    { header: "User Type", accessor: "user_type" },
    { header: "OS Type", accessor: "os_type" },
    {
      header: "Action",
      render: (row) => (
        <ActionButtons
          row={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <DataTableLayout
        title="User Management"


        stats={
          <div className="flex flex-wrap gap-4">
            <StatCard title="Total Users" value={stats.total} />
            <StatCard title="Active Users" value={stats.active} />
            <StatCard title="Inactive Users" value={stats.inactive} />
          </div>
        }


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
          <Button
            variant="danger"
            onClick={() => {
              setSelectedUser(null);
              setViewMode(false);
              setOpenModal(true);
            }}
          >
            + ADD NEW USER
          </Button>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading users...</p>
        ) : (
          <DataTable columns={columns} data={filteredUsers} />
        )}
      </DataTableLayout>

      {/* 🔥 MODAL */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={
          viewMode
            ? "View User"
            : selectedUser
            ? "Edit User"
            : "Add New User"
        }
      >
        <UserForm
          user={selectedUser}
          readOnly={viewMode}
          onSuccess={() => {
            setOpenModal(false);
            fetchUsers();
            fetchStats();
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default UserManagement;