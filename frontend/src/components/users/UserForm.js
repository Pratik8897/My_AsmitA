import { useCallback, useEffect, useMemo, useState } from "react";
import { createUser, getUserFlatMappings, updateUser } from "../../services/userService";
import PasswordField from "../ui/PasswordField";
import { getTowersBySociety } from "../../services/societyService";
import { getAssignedFlatIdsBySociety, getFlatsBySociety } from "../../services/flatsService";

const baseForm = {
  full_name: "",
  email_id: "",
  mobile_number: "",
  gender: "Male",
  account_type: "app",
  user_type: "User",
  os_type: "Android",
  password_hash: "",
  society_id: "",
};

const mobileNumberPattern = /^\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitialForm = (roles = [], accountType = baseForm.account_type) => ({
  ...baseForm,
  account_type: accountType,
  user_type: roles[0] || baseForm.user_type,
});

const formatAccountType = (value = "") =>
  String(value)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const fieldClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-400";

const UserForm = ({
  user,
  readOnly = false,
  onSuccess,
  roles = [],
  accountType = "app",
  formTitle = "User Details",
  roleLabel = "Role",
  accountTypeLabel = "Account Type",
  showAccountTypeField = false,
  showGenderField = true,
  showOsTypeField = true,
  showPasswordField = false,
  passwordLabel = "Password",
  passwordRequired = false,
  societies = [],
  defaultSocietyId = "",
  lockSociety = false,
}) => {
  const [form, setForm] = useState(getInitialForm(roles, accountType));
  const [error, setError] = useState("");
  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [assignedFlatIds, setAssignedFlatIds] = useState(() => new Set());
  const [flatMappings, setFlatMappings] = useState([
    { tower_id: "", flat_id: "", ownership_type: "Owner" },
  ]);
  const roleOptions = useMemo(
    () => Array.from(new Set([...roles, user?.user_type].filter(Boolean))),
    [roles, user?.user_type]
  );

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email_id: user.email_id || "",
        mobile_number: user.mobile_number || "",
        gender: user.gender || "Male",
        account_type: user.account_type || accountType,
        user_type: user.user_type || roleOptions[0] || baseForm.user_type,
        os_type: user.os_type || "Android",
        password_hash: "",
        society_id: user.society_id ? String(user.society_id) : (defaultSocietyId ? String(defaultSocietyId) : ""),
      });
      setError("");
      return;
    }

    setForm({
      ...getInitialForm(roleOptions, accountType),
      society_id: defaultSocietyId ? String(defaultSocietyId) : "",
    });
    setError("");
  }, [accountType, defaultSocietyId, roleOptions, user]);

  const loadSocietyData = useCallback(async (societyId) => {
    if (!societyId) {
      setTowers([]);
      setFlats([]);
      return;
    }

    try {
      const [towerRows, flatRows] = await Promise.all([
        getTowersBySociety(societyId),
        getFlatsBySociety(societyId),
      ]);

      setTowers(towerRows || []);
      setFlats(flatRows || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!form.society_id) return;
    loadSocietyData(form.society_id);
  }, [form.society_id, loadSocietyData]);

  useEffect(() => {
    const loadAssigned = async () => {
      if (!form.society_id) {
        setAssignedFlatIds(new Set());
        return;
      }

      try {
        const ids = await getAssignedFlatIdsBySociety(form.society_id);
        setAssignedFlatIds(new Set((ids || []).map((n) => Number(n))));
      } catch (err) {
        console.error(err);
        setAssignedFlatIds(new Set());
      }
    };

    loadAssigned();
  }, [form.society_id]);

  useEffect(() => {
    const loadMappings = async () => {
      if (!user?.user_id) return;
      try {
        const mappings = await getUserFlatMappings(user.user_id);

        if (Array.isArray(mappings) && mappings.length) {
          // We don't store tower_id in mapping table; infer it from flats list if available.
          const next = mappings.map((m) => {
            const flatRow = flats.find((f) => Number(f.flat_id) === Number(m.flat_id));
            return {
              tower_id: flatRow ? String(flatRow.tower_id) : "",
              flat_id: String(m.flat_id),
              ownership_type: m.ownership_type === "Tenant" ? "Tenant" : "Owner",
            };
          });
          setFlatMappings(next);
        } else {
          setFlatMappings([{ tower_id: "", flat_id: "", ownership_type: "Owner" }]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadMappings();
  }, [user?.user_id, flats]);

  const handleChange = (e) => {
    if (readOnly) {
      return;
    }

    setError("");
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, [name]: sanitizedValue });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSocietyChange = (e) => {
    if (readOnly || lockSociety) return;
    const value = e.target.value;
    setForm((prev) => ({ ...prev, society_id: value }));
    setFlatMappings([{ tower_id: "", flat_id: "", ownership_type: "Owner" }]);
  };

  const handleFlatMappingChange = (index, field, value) => {
    if (readOnly) return;

    setFlatMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Reset flat when tower changes
      if (field === "tower_id") {
        next[index].flat_id = "";
      }

      return next;
    });
  };

  const addFlatRow = () => {
    setFlatMappings((prev) => [
      ...prev,
      { tower_id: "", flat_id: "", ownership_type: "Owner" },
    ]);
  };

  const removeFlatRow = (index) => {
    setFlatMappings((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const flatOptionsByTower = useMemo(() => {
    const allowedForThisUser = new Set(
      flatMappings
        .map((m) => Number(m.flat_id))
        .filter((n) => Number.isInteger(n) && n > 0)
    );

    const mergedFlatIds = new Set(
      flats
        .filter((flat) => String(flat?.flat_number || "").includes("+"))
        .map((flat) => Number(flat.flat_id))
        .filter((n) => Number.isInteger(n) && n > 0)
    );

    const byTower = new Map();
    for (const flat of flats) {
      const flatId = Number(flat?.flat_id);
      const isAssigned = assignedFlatIds.has(flatId);
      const canUse = !isAssigned || allowedForThisUser.has(flatId);
      if (!canUse) continue;

      const flatNumber = String(flat?.flat_number || "");
      const unitType = String(flat?.unit_type || "");
      const isMerged = Number(flat?.is_merged) === 1;

      // For merges:
      // - show the merged flat row ("101+102" with unit_type=Jodi)
      // - hide member flats so the dropdown doesn't show duplicates
      if (flatNumber.includes("+")) {
        // keep merged row
      } else if (flat.merged_from && mergedFlatIds.size) {
        // member flat
        continue;
      }

      if (unitType.toUpperCase() === "MERGED") continue;
      if (flatNumber.startsWith("M-")) continue;

      const key = String(flat.tower_id || "");
      if (!byTower.has(key)) byTower.set(key, []);
      byTower.get(key).push(flat);
    }

    // sort each list by flat_number
    for (const [key, list] of byTower.entries()) {
      list.sort((a, b) =>
        String(a.flat_number).localeCompare(String(b.flat_number), undefined, { numeric: true })
      );
      byTower.set(key, list);
    }

    return byTower;
  }, [assignedFlatIds, flats, flatMappings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!emailPattern.test(form.email_id.trim().toLowerCase())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!mobileNumberPattern.test(form.mobile_number)) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (showPasswordField && passwordRequired && !form.password_hash.trim()) {
      setError("Password is required for dashboard users.");
      return;
    }

    try {
      const expandFlatIds = (flatId) => {
        const id = Number(flatId);
        if (!Number.isInteger(id) || id <= 0) return [];

        const selected = flats.find((f) => Number(f.flat_id) === id);
        if (!selected) return [id];

        const flatNumber = String(selected.flat_number || "");
        if (!flatNumber.includes("+")) return [id];

        // If user selects merged flat "101+102", assign the same user to all member flats too.
        const members = flats
          .filter((f) => String(f.merged_from || "") === flatNumber)
          .filter((f) => !String(f.flat_number || "").includes("+"))
          .map((f) => Number(f.flat_id))
          .filter((n) => Number.isInteger(n) && n > 0);

        return Array.from(new Set([id, ...members]));
      };

      const payload = {
        ...form,
        society_id: form.society_id ? Number(form.society_id) : null,
        flat_mappings: (() => {
          const expanded = flatMappings
            .flatMap((m) => {
              const ownership_type =
                m.ownership_type === "Tenant" ? "Tenant" : "Owner";

              return expandFlatIds(m.flat_id).map((flat_id) => ({
                flat_id,
                ownership_type,
              }));
            })
            .filter((m) => Number.isInteger(m.flat_id) && m.flat_id > 0);

          const unique = new Map();
          for (const mapping of expanded) {
            if (!unique.has(mapping.flat_id)) unique.set(mapping.flat_id, mapping);
          }
          return Array.from(unique.values());
        })(),
      };

      if (user) {
        await updateUser(user.user_id, payload);
      } else {
        await createUser(payload);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Unable to save user right now.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formTitle && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            {formTitle}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Fill in the user details and assign the correct access role.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(lockSociety || societies.length > 0) && (
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
              Society
            </span>
            <select
              name="society_id"
              value={form.society_id || ""}
              onChange={handleSocietyChange}
              disabled={readOnly || lockSociety}
              className={fieldClassName}
            >
              {!lockSociety && <option value="">Select Society</option>}
              {societies.map((s) => (
                <option key={s.society_id} value={String(s.society_id)}>
                  {s.society_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </span>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            disabled={readOnly}
            placeholder="Full Name"
            className={fieldClassName}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            Email
          </span>
          <input
            type="email"
            name="email_id"
            value={form.email_id}
            onChange={handleChange}
            disabled={readOnly}
            placeholder="Email"
            required
            className={fieldClassName}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            Mobile Number
          </span>
          <input
            type="tel"
            name="mobile_number"
            value={form.mobile_number}
            onChange={handleChange}
            disabled={readOnly}
            placeholder="Mobile"
            inputMode="numeric"
            maxLength={10}
            required
            className={fieldClassName}
          />
        </label>

        {showAccountTypeField && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
              {accountTypeLabel}
            </span>
            <input
              value={formatAccountType(form.account_type)}
              disabled
              className={fieldClassName}
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
            {roleLabel}
          </span>
          <select
            name="user_type"
            value={form.user_type}
            onChange={handleChange}
            disabled={readOnly}
            className={fieldClassName}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        {showPasswordField && !readOnly && (
          <PasswordField
            label={passwordLabel}
            name="password_hash"
            value={form.password_hash}
            onChange={handleChange}
            placeholder={
              user ? "Leave blank to keep current password" : "Password"
            }
            required={passwordRequired}
          />
        )}

        {showGenderField && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
              Gender
            </span>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={readOnly}
              className={fieldClassName}
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>
        )}

        {showOsTypeField && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
              OS Type
            </span>
            <select
              name="os_type"
              value={form.os_type}
              onChange={handleChange}
              disabled={readOnly}
              className={fieldClassName}
            >
              <option>Android</option>
              <option>iOS</option>
            </select>
          </label>
        )}
      </div>

      {/* Flat mapping */}
      {!!form.society_id && (
        <div className="rounded border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">
              Assign Flat(s)
            </div>
            {!readOnly && (
              <button
                type="button"
                className="text-sm text-blue-600 underline"
                onClick={addFlatRow}
              >
                + Hold Multiple Units
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {flatMappings.map((row, idx) => {
              const flatsForTower = flatOptionsByTower.get(String(row.tower_id || "")) || [];

              return (
                <div key={idx} className="grid gap-2 md:grid-cols-4 items-end">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">
                      Tower
                    </span>
                    <select
                      value={row.tower_id}
                      disabled={readOnly}
                      onChange={(e) =>
                        handleFlatMappingChange(idx, "tower_id", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select Tower</option>
                      {towers.map((t) => (
                        <option key={t.tower_id} value={String(t.tower_id)}>
                          {t.tower_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">
                      Flat
                    </span>
                    <select
                      value={row.flat_id}
                      disabled={readOnly || !row.tower_id}
                      onChange={(e) =>
                        handleFlatMappingChange(idx, "flat_id", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select Flat</option>
                      {flatsForTower.map((f) => (
                        <option key={f.flat_id} value={String(f.flat_id)}>
                          {f.flat_number}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">
                      Type
                    </span>
                    <select
                      value={row.ownership_type}
                      disabled={readOnly}
                      onChange={(e) =>
                        handleFlatMappingChange(idx, "ownership_type", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="Owner">Owner</option>
                      <option value="Tenant">Tenant</option>
                    </select>
                  </label>

                  {!readOnly ? (
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        className="text-red-600 underline text-sm"
                        onClick={() => removeFlatRow(idx)}
                        disabled={flatMappings.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!readOnly && (
        <button className="rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
          {user ? "Update User" : "Create User"}
        </button>
      )}
    </form>
  );
};

export default UserForm;
