import { useEffect, useMemo, useState } from "react";
import { createUser, updateUser } from "../../services/userService";
import PasswordField from "../ui/PasswordField";

const baseForm = {
  full_name: "",
  email_id: "",
  mobile_number: "",
  gender: "Male",
  account_type: "app",
  user_type: "User",
  os_type: "Android",
  password_hash: "",
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
}) => {
  const [form, setForm] = useState(getInitialForm(roles, accountType));
  const [error, setError] = useState("");
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
      });
      setError("");
      return;
    }

    setForm(getInitialForm(roleOptions, accountType));
    setError("");
  }, [accountType, roleOptions, user]);

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
      if (user) {
        await updateUser(user.user_id, form);
      } else {
        await createUser(form);
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

      {!readOnly && (
        <button className="rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
          {user ? "Update User" : "Create User"}
        </button>
      )}
    </form>
  );
};

export default UserForm;
