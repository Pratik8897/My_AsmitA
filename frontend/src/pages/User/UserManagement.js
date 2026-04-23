import { useEffect, useMemo, useState } from "react";
import "./UserManagement.css";

import AdminLayout from "../../layouts/AdminLayout";
import DataTableLayout from "../../layouts/DataTableLayout";
import DataTable from "../../components/common/DataTable";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import ActionButtons from "../../components/common/ActionButtons";
import Modal from "../../components/ui/Modal";
import UserForm from "../../components/users/UserForm";
import FilterBar from "../../components/common/FilterBar";
import {
  APP_SETTINGS_EVENT,
  defaultAppSettings,
  getAppSettings,
  getResidentRoles,
} from "../../services/appSettingsService";
import { deleteUser, getUsers } from "../../services/userService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [roleOptions, setRoleOptions] = useState(
    getResidentRoles(defaultAppSettings).map((role) => role.name)
  );
  const [filters, setFilters] = useState({
    os_type: [],
    user_type: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    os_type: [],
    user_type: [],
  });

  const appUsers = useMemo(
    () => users,
    [users]
  );

  const stats = useMemo(
    () => ({
      total: appUsers.length,
      active: appUsers.length,
      inactive: 0,
    }),
    [appUsers.length]
  );

  const filtersConfig = [
    {
      key: "os_type",
      label: "OS Type",
      options: ["Android", "iOS"],
    },
    {
      key: "user_type",
      label: "User Type",
      options: roleOptions,
    },
  ];

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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const syncRoles = async () => {
      const settings = await getAppSettings();
      const residentRoleNames = getResidentRoles(settings).map(
        (role) => role.name
      );

      setRoleOptions(residentRoleNames);
    };

    syncRoles();
    window.addEventListener(APP_SETTINGS_EVENT, syncRoles);

    return () => {
      window.removeEventListener(APP_SETTINGS_EVENT, syncRoles);
    };
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const empty = { os_type: [], user_type: [] };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const filteredUsers = appUsers.filter((user) => {
    return (
      (appliedFilters.os_type.length === 0 ||
        appliedFilters.os_type.includes(user.os_type)) &&
      (appliedFilters.user_type.length === 0 ||
        appliedFilters.user_type.includes(user.user_type))
    );
  });

  const handleDelete = async (row) => {
    if (!window.confirm("Deactivate this user?")) {
      return;
    }

    try {
      await deleteUser(row.user_id);
      fetchUsers();
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
        title="App User Management"
        stats={
          <div className="flex flex-wrap gap-4">
            <StatCard title="App Users" value={stats.total} />
            <StatCard title="Active App Users" value={stats.active} />
            <StatCard title="Inactive App Users" value={stats.inactive} />
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
            + ADD APP USER
          </Button>
        }
      >
        {loading ? (
          <p className="p-4 text-gray-500">Loading app users...</p>
        ) : (
          <DataTable columns={columns} data={filteredUsers} />
        )}
      </DataTableLayout>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={
          viewMode
            ? "View App User"
            : selectedUser
            ? "Edit App User"
            : "Add App User"
        }
      >
        <UserForm
          user={selectedUser}
          readOnly={viewMode}
          roles={roleOptions}
          accountType="app"
          formTitle="App User Details"
          roleLabel="App Role"
          onSuccess={() => {
            setOpenModal(false);
            fetchUsers();
          }}
        />
      </Modal>
    </AdminLayout>
  );
};

export default UserManagement;
