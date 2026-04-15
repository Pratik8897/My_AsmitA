import { useEffect, useState } from "react";
import { createUser, updateUser } from "../../services/userService";

const initialForm = {
  full_name: "",
  email_id: "",
  mobile_number: "",
  gender: "Male",
  user_type: "Owner",
  os_type: "Android",
  password_hash: "",
};

const UserForm = ({ user, readOnly = false, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email_id: user.email_id || "",
        mobile_number: user.mobile_number || "",
        gender: user.gender || "Male",
        user_type: user.user_type || "Owner",
        os_type: user.os_type || "Android",
        password_hash: "",
      });
      setError("");
      return;
    }

    setForm(initialForm);
    setError("");
  }, [user]);

  const handleChange = (e) => {
    if (readOnly) return;

    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (user) {
        await updateUser(user.user_id, form);
      } else {
        await createUser(form);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Unable to save user right now."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <input
        name="full_name"
        value={form.full_name}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Full Name"
        className="input"
      />

      <input
        name="email_id"
        value={form.email_id}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Email"
        className="input"
      />

      <input
        name="mobile_number"
        value={form.mobile_number}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Mobile"
        className="input"
      />

      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        disabled={readOnly}
        className="input"
      >
        <option>Male</option>
        <option>Female</option>
      </select>

      <select
        name="user_type"
        value={form.user_type}
        onChange={handleChange}
        disabled={readOnly}
        className="input"
      >
        <option>Owner</option>
        <option>Tenant</option>
        <option>Super Admin</option>
        <option>Society Admin</option>
      </select>

      <select
        name="os_type"
        value={form.os_type}
        onChange={handleChange}
        disabled={readOnly}
        className="input"
      >
        <option>Android</option>
        <option>iOS</option>
      </select>

      {!readOnly && (
        <button className="bg-blue-600 text-white py-2 rounded">
          {user ? "Update User" : "Create User"}
        </button>
      )}
    </form>
  );
};

export default UserForm;
