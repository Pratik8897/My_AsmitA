import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheckIcon,
  UsersIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import {
  getAppSettings,
  saveAppSettings,
  getDefaultRestrictions,
  defaultRoleRestrictions,
  defaultAppSettings,
} from "../../services/appSettingsService";

const settingsMenus = [
  {
    id: "roles",
    label: "Roles",
    description: "Manage roles, access rules, and restrictions.",
    icon: ShieldCheckIcon,
  },
  {
    id: "admin-users",
    label: "Admin User Management",
    description: "Future area for admin accounts and permissions.",
    icon: UsersIcon,
  },
  {
    id: "images",
    label: "Images",
    description: "Manage logos, banners, and default media assets.",
    icon: PhotoIcon,
  },
  {
    id: "export-data",
    label: "Export Data",
    description: "Prepare reports, exports, and download controls.",
    icon: ArrowDownTrayIcon,
  },
];

const roleTabs = [
  { id: "roles-access", label: "Roles & Access" },
  { id: "restrictions", label: "Restrictions" },
  { id: "controls", label: "Controls" },
  { id: "other", label: "Other" },
];

const restrictionItems = [
  {
    key: "allowSelfRegistration",
    label: "Allow self registration",
    help: "Residents can create their own accounts without admin help.",
  },
  {
    key: "requireInviteForAdmins",
    label: "Require invite for admin roles",
    help: "Admin and elevated accounts must be invited before access is granted.",
  },
  {
    key: "restrictSocietyCreationToAdmins",
    label: "Restrict society creation to admins",
    help: "Only admin-level roles can add new societies.",
  },
  {
    key: "requireApprovalForResidentAccounts",
    label: "Require approval for resident accounts",
    help: "Owner, tenant, and user roles stay pending until approved.",
  },
  {
    key: "allowRoleEditingForSocietyAdmins",
    label: "Allow society admins to edit roles",
    help: "Society admins can assign or adjust role labels for their teams.",
  },
  {
    key: "enableVisitorAndSecurityRoles",
    label: "Enable visitor and security roles",
    help: "Security and support teams can be assigned operational accounts.",
  },
];

const roleRestrictionItems = [
  {
    key: "canManageUsers",
    label: "Manage users",
    help: "Can create, edit, or disable resident and staff users.",
  },
  {
    key: "canManageSocieties",
    label: "Manage societies",
    help: "Can create or update societies and society-level structure.",
  },
  {
    key: "canApproveResidents",
    label: "Approve residents",
    help: "Can review and approve owner, tenant, or resident accounts.",
  },
  {
    key: "canManageBilling",
    label: "Manage billing",
    help: "Can handle dues, accounting actions, and billing workflows.",
  },
  {
    key: "canManageAmenities",
    label: "Manage amenities",
    help: "Can control amenities, booking rules, and amenity content.",
  },
  {
    key: "canExportData",
    label: "Export data",
    help: "Can download exports, reports, and operational data.",
  },
];

const placeholderCards = {
  "admin-users": {
    title: "Admin User Management",
    text: "Use this section for admin onboarding, admin approval flow, password policy, and elevated permission groups.",
    items: [
      "Admin approval workflow",
      "Admin password rules",
      "Permission groups",
      "Activity logs",
    ],
  },
  images: {
    title: "Images",
    text: "Use this section for society logo upload, dashboard banners, amenity thumbnails, and default user profile assets.",
    items: [
      "Society logo",
      "App banners",
      "Amenity images",
      "Default avatars",
    ],
  },
  "export-data": {
    title: "Export Data",
    text: "Use this section for resident exports, billing downloads, booking reports, support reports, and audit extracts.",
    items: [
      "User export",
      "Society export",
      "Booking report",
      "Audit report",
    ],
  },
};

const createRoleForm = () => ({
  id: null,
  name: "",
  scope: "Society",
  description: "",
  restrictions: {
    ...defaultRoleRestrictions,
  },
});

const Settings = () => {
  const [settings, setSettings] = useState(defaultAppSettings);
  const [activeMenu, setActiveMenu] = useState("roles");
  const [activeRoleTab, setActiveRoleTab] = useState("roles-access");
  const [roleForm, setRoleForm] = useState(createRoleForm);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const customRoleCount = useMemo(
    () => settings.roles.filter((role) => !role.isSystem).length,
    [settings.roles]
  );

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      const data = await getAppSettings();
      setSettings(data);
      setLoadingSettings(false);
    };

    loadSettings();
  }, []);

  const handleRestrictionToggle = (key) => {
    setError("");
    setMessage("");
    setSettings((prev) => ({
      ...prev,
      restrictions: {
        ...prev.restrictions,
        [key]: !prev.restrictions[key],
      },
    }));
  };

  const handleRoleRestrictionToggle = (key) => {
    setRoleForm((prev) => ({
      ...prev,
      restrictions: {
        ...prev.restrictions,
        [key]: !prev.restrictions[key],
      },
    }));
  };

  const handleSaveRestrictions = async () => {
    const nextSettings = await saveAppSettings(settings);
    setSettings(nextSettings);
    setMessage("Settings saved successfully.");
    setError("");
  };

  const resetRoleForm = () => {
    setRoleForm(createRoleForm());
    setEditingRoleId(null);
    setIsRoleModalOpen(false);
  };

  const openCreateRoleModal = () => {
    setRoleForm(createRoleForm());
    setEditingRoleId(null);
    setIsRoleModalOpen(true);
    setMessage("");
    setError("");
  };

  const handleEditRole = (role) => {
    setRoleForm({
      id: role.id,
      name: role.name,
      scope: role.scope,
      description: role.description,
      restrictions: {
        ...defaultRoleRestrictions,
        ...role.restrictions,
      },
    });
    setEditingRoleId(role.id);
    setActiveRoleTab("roles-access");
    setIsRoleModalOpen(true);
    setMessage("");
    setError("");
  };

  const handleAddRole = async (e) => {
    e.preventDefault();

    const trimmedName = roleForm.name.trim();
    const trimmedDescription = roleForm.description.trim();

    if (!trimmedName) {
      setError("Role name is required.");
      setMessage("");
      return;
    }

    const roleExists = settings.roles.some(
      (role) =>
        role.name.toLowerCase() === trimmedName.toLowerCase() &&
        role.id !== editingRoleId
    );

    if (roleExists) {
      setError("That role already exists.");
      setMessage("");
      return;
    }

    const rolePayload = {
      id: editingRoleId || trimmedName.toLowerCase().replace(/\s+/g, "-"),
      name: trimmedName,
      scope: roleForm.scope,
      description:
        trimmedDescription || "Custom role created from settings.",
      isSystem: settings.roles.find((role) => role.id === editingRoleId)?.isSystem || false,
      restrictions: {
        ...defaultRoleRestrictions,
        ...roleForm.restrictions,
      },
    };

    const nextRoles = editingRoleId
      ? settings.roles.map((role) =>
          role.id === editingRoleId ? { ...role, ...rolePayload } : role
        )
      : [...settings.roles, rolePayload];

    const nextSettings = await saveAppSettings({
      ...settings,
      roles: nextRoles,
    });

    setSettings(nextSettings);
    resetRoleForm();
    setMessage(
      editingRoleId
        ? "Role updated successfully."
        : "Role created successfully."
    );
    setError("");
  };

  const handleDeleteRole = async (roleName) => {
    const nextSettings = await saveAppSettings({
      ...settings,
      roles: settings.roles.filter((role) => role.name !== roleName),
    });

    setSettings(nextSettings);
    setMessage(`${roleName} removed successfully.`);
    setError("");
    if (roleForm.name === roleName) {
      resetRoleForm();
    }
  };

  const handleResetRestrictions = () => {
    setSettings((prev) => ({
      ...prev,
      restrictions: getDefaultRestrictions(),
    }));
    setMessage("Restrictions reset to defaults. Save to apply them.");
    setError("");
  };

  const renderRoleAccess = () => (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Role Catalog
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              These roles are available while creating or editing users.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[260px]">
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-blue-700">
              <div className="text-xs uppercase tracking-wide">Roles</div>
              <div className="mt-1 text-2xl font-semibold">
                {settings.roles.length}
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-amber-700">
              <div className="text-xs uppercase tracking-wide">Custom</div>
              <div className="mt-1 text-2xl font-semibold">
                {customRoleCount}
              </div>
            </div>
          </div>
          <Button type="button" onClick={openCreateRoleModal}>
            Add Role
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {settings.roles.map((role) => {
            const enabledRestrictions = roleRestrictionItems.filter(
              (item) => role.restrictions?.[item.key]
            );

            return (
              <article
                key={role.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {role.name}
                    </h4>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                      {role.scope}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                    {role.isSystem ? "System" : "Custom"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {role.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {enabledRestrictions.length > 0 ? (
                    enabledRestrictions.map((item) => (
                      <span
                        key={item.key}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {item.label}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                      No special restrictions
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleEditRole(role)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit Role
                  </button>
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role.name)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove Role
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderRestrictions = () => (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Restrictions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Control who can sign up, create societies, and edit roles.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetRestrictions}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        {restrictionItems.map((item) => (
          <label
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <div>
              <p className="font-medium text-gray-800 dark:text-white">
                {item.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.help}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.restrictions[item.key]}
              onChange={() => handleRestrictionToggle(item.key)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        ))}
      </div>

      <div className="mt-5">
        <Button onClick={handleSaveRestrictions}>Save Restrictions</Button>
      </div>
    </section>
  );

  const renderControls = () => (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        Controls
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This tab is ready for society-level control settings like onboarding
        rules, committee permissions, amenity visibility, and operational
        workflows.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[
          "Society onboarding rules",
          "Committee permissions",
          "Amenity approval controls",
          "Operational workflow controls",
        ].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );

  const renderOther = () => (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        Other
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Use this tab for future advanced options like audit settings, role notes,
        legacy mappings, and custom society rules.
      </p>
      <div className="mt-5 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
        Additional role-related settings can be added here next.
      </div>
    </section>
  );

  const renderRoleMenuContent = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeRoleTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeRoleTab === "roles-access" && renderRoleAccess()}
      {activeRoleTab === "restrictions" && renderRestrictions()}
      {activeRoleTab === "controls" && renderControls()}
      {activeRoleTab === "other" && renderOther()}
    </div>
  );

  const renderPlaceholderMenu = () => {
    const content = placeholderCards[activeMenu];

    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {content.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {content.text}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {content.items.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Settings
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage roles, admin settings, images, exports, and future modules from one place.
          </p>

          {message && (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Settings Menu
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a menu and manage each area separately.
              </p>
            </div>

            <nav className="space-y-3">
              {settingsMenus.map((menu) => {
                const Icon = menu.icon;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setActiveMenu(menu.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition ${
                      activeMenu === menu.id
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="font-medium">{menu.label}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {menu.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div>
            {loadingSettings ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading settings...
                </p>
              </section>
            ) : activeMenu === "roles" ? (
              renderRoleMenuContent()
            ) : (
              renderPlaceholderMenu()
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isRoleModalOpen}
        onClose={resetRoleForm}
        title={editingRoleId ? "Edit Role" : "Add Role"}
      >
        <form onSubmit={handleAddRole} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role Name
              </label>
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Community Moderator"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scope
              </label>
              <select
                value={roleForm.scope}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    scope: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option>Platform</option>
                <option>Society</option>
                <option>Resident</option>
                <option>Operations</option>
                <option>Finance</option>
                <option>Support</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              rows="3"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="What this role is responsible for"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
              Restriction Management
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pick what this role is allowed to manage while creating or editing it.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {roleRestrictionItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.help}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={roleForm.restrictions[item.key]}
                    onChange={() => handleRoleRestrictionToggle(item.key)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit">
              {editingRoleId ? "Update Role" : "Create Role"}
            </Button>
            <Button type="button" variant="outline" onClick={resetRoleForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default Settings;
