import { useState, useEffect } from "react";
import FormInput from "../ui/FormInput";
import Button from "../ui/Button";
import {
  createSociety,
  updateSociety,
} from "../../services/societyService";
import { validateForm } from "../../utils/validateForm";
import { societyValidationRules } from "../../utils/validationRules";
import { toast } from "react-toastify";

const SocietyForm = ({ society, readOnly = false, onSuccess }) => {
  const [form, setForm] = useState({
    society_name: "",
    city: "",
    state: "",
    country: "India",
    contact_number: "",
    contact_email: "",
    pincode: "",
    address: "",
    google_map_url: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* ---------------- PREFILL (EDIT / VIEW) ---------------- */
  useEffect(() => {
    if (society) {
      setForm({
        society_name: society.society_name || "",
        city: society.city || "",
        state: society.state || "",
        country: society.country || "India",
        contact_number: society.contact_number || "",
        contact_email: society.contact_email || "",
        pincode: society.pincode || "",
        address: society.address || "",
        google_map_url: society.google_map_url || "",
        latitude: society.latitude || "",
        longitude: society.longitude || "",
      });
    }
  }, [society]);

  /* ---------------- EXTRACT LAT/LNG ---------------- */
  const extractLatLng = (url) => {
    try {
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return { lat: match[1], lng: match[2] };
      }
    } catch {}
    return null;
  };

  /* ---------------- HANDLE CHANGE ---------------- */
  const handleChange = (e) => {
    if (readOnly) return;

    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "contact_number") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      updatedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /* ---------------- HANDLE MAP ---------------- */
  const handleMapChange = (e) => {
    if (readOnly) return;

    const value = e.target.value;
    const coords = extractLatLng(value);

    setForm((prev) => ({
      ...prev,
      google_map_url: value,
      latitude: coords?.lat || prev.latitude,
      longitude: coords?.lng || prev.longitude,
    }));
  };

  /* ---------------- VALIDATE ---------------- */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const rules = societyValidationRules[name];

    if (!rules) return;

    for (const rule of rules) {
      if (!rule.validate(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: rule.message,
        }));
        return;
      }
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (readOnly) return;

    const err = validateForm(form, societyValidationRules);

    if (Object.keys(err).length) {
      setErrors(err);
      toast.error(Object.values(err)[0]);
      return;
    }

    try {
      setLoading(true);

      if (society) {
        await updateSociety(society.society_id, form);
        toast.success("Society updated successfully");
        onSuccess();
      } else {
        const res = await createSociety(form);
        onSuccess(res.society_id);
      }
    } catch (err) {
      // handled in service
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FormInput label="Society Name" name="society_name" value={form.society_name} onChange={handleChange} onBlur={handleBlur} error={errors.society_name} disabled={readOnly} required />

        <FormInput label="Contact Number" name="contact_number" value={form.contact_number} onChange={handleChange} onBlur={handleBlur} error={errors.contact_number} disabled={readOnly} required />

        <FormInput label="Email" name="contact_email" value={form.contact_email} onChange={handleChange} onBlur={handleBlur} error={errors.contact_email} disabled={readOnly} />

        <FormInput label="City" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} disabled={readOnly} required />

        <FormInput label="State" name="state" value={form.state} onChange={handleChange} disabled={readOnly} />

        <FormInput label="Country" name="country" value={form.country} onChange={handleChange} disabled={readOnly} />

        <FormInput label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} onBlur={handleBlur} error={errors.pincode} disabled={readOnly} />

        <FormInput label="Google Map URL" name="google_map_url" value={form.google_map_url} onChange={handleMapChange} disabled={readOnly} />

        <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} onBlur={handleBlur} error={errors.latitude} disabled={readOnly} />

        <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} onBlur={handleBlur} error={errors.longitude} disabled={readOnly} />

      </div>

      {/* ADDRESS */}
      <FormInput
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange}
        textarea
        disabled={readOnly}
      />

      {/* MAP */}
      {form.latitude && form.longitude && (
        <div className="w-full h-48 rounded overflow-hidden border">
          <iframe
            title="map"
            width="100%"
            height="100%"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
          />
        </div>
      )}

      {/* BUTTON */}
      {!readOnly && (
        <Button type="submit" loading={loading} fullWidth>
          {society ? "Update Society" : "Create Society"}
        </Button>
      )}

    </form>
  );
};

export default SocietyForm;
