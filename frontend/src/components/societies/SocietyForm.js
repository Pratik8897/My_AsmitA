import { useEffect, useState } from "react";
import {
  createSociety,
  updateSociety,
} from "../../services/societyService";

const SocietyForm = ({ society, readOnly = false, onSuccess }) => {
  const [form, setForm] = useState({
    society_name: "",
    address: "",
    google_pin_location: "",
  });

  // 🔥 Populate for edit/view
  useEffect(() => {
    if (society) {
      setForm({
        society_name: society.society_name || "",
        address: society.address || "",
        google_pin_location: society.google_pin_location || "",
      });
      return;
    }

    setForm({
      society_name: "",
      address: "",
      google_pin_location: "",
    });
  }, [society]);

  const handleChange = (e) => {
    if (readOnly) return;

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (society) {
        await updateSociety(society.society_id, form);
      } else {
        await createSociety(form);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      <input
        name="society_name"
        value={form.society_name}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Society Name"
        className="input"
        required
      />

      <textarea
        name="address"
        value={form.address}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Address"
        className="input"
      />

      <input
        name="google_pin_location"
        value={form.google_pin_location}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Google Pin Location"
        className="input"
      />

      {!readOnly && (
        <button className="bg-blue-600 text-white py-2 rounded">
          {society ? "Update Society" : "Create Society"}
        </button>
      )}

    </form>
  );
};

export default SocietyForm;
