import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import {
    createSocietyAdmin,
    updateSocietyAdmin,
} from "../../services/SocietyAdminServices";
import { getSocieties } from "../../services/societyService";
import PasswordField from "../ui/PasswordField";

const selectStyles = {
    control: (base) => ({
        ...base,
        minHeight: "42px",
        borderColor: "#d1d5db",
        borderRadius: "0.5rem",
        boxShadow: "none",
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
    }),
};

const SocietyAdminForm = ({
    society,
    societies = [],
    readOnly = false,
    onSuccess,
}) => {
    const [form, setForm] = useState({
        society_admin_name: "",
        society_id: "",
        email: "",
        phone: "",
        password_hash: "",
    });
    const [error, setError] = useState("");

    // Populate for edit/view
    useEffect(() => {
        if (society) {
            setForm({
                society_admin_name: society.society_admin_name || "",
                society_id: society.society_id || "",
                email: society.email || "",
                phone: society.phone || "",
                password_hash: "",
            });
            setError("");
            return;
        }

        setForm({
            society_admin_name: "",
            society_id: "",
            email: "",
            phone: "",
            password_hash: "",
        });
        setError("");
    }, [society, societies]);

    const handleChange = (e) => {
        if (readOnly) return;
        setError("");

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const loadSocietyOptions = async (inputValue) => {
        const societies = await getSocieties(inputValue);

        return societies.map((item) => ({
            value: item.society_id,
            label: item.society_name,
        }));
    };

    const selectedSocietyOption = form.society_id
        ? {
              value: form.society_id,
              label:
                  society?.society_name ||
                  societies.find(
                      (item) => String(item.society_id) === String(form.society_id)
                  )?.society_name ||
                  "",
          }
        : null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.society_admin_name.trim()) {
            setError("Society admin name is required.");
            return;
        }

        if (!form.society_id) {
            setError("Please select a society.");
            return;
        }

        const normalizedEmail = form.email.trim().toLowerCase();
        const normalizedPhone = form.phone.replace(/\D/g, "").slice(0, 10);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(normalizedPhone)) {
            setError("Phone number must be exactly 10 digits.");
            return;
        }

        try {
            const payload = {
                ...form,
                email: normalizedEmail,
                phone: normalizedPhone,
            };

            if (society) {
                await updateSocietyAdmin(society.user_id, payload);
            } else {
                await createSocietyAdmin(payload);
            }

            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Unable to save society admin right now.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <input
                name="society_admin_name"
                value={form.society_admin_name}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Society Admin Name"
                className="input"
                required
            />

            {/* <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Society
            </label> */}

            <AsyncSelect
                cacheOptions
                defaultOptions={societies.map((item) => ({
                    value: item.society_id,
                    label: item.society_name,
                }))}
                loadOptions={loadSocietyOptions}
                value={selectedSocietyOption}
                onChange={(option) =>
                    setForm((prev) => ({
                        ...prev,
                        society_id: option ? option.value : "",
                    }))
                }
                isDisabled={readOnly}
                placeholder="Search society name..."
                styles={selectStyles}
                menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                classNamePrefix="react-select"
                className="w-full text-sm"
                isClearable
                required
            />

            <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Email"
                className="input"
                required
            />

            <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Phone"
                inputMode="numeric"
                maxLength={10}
                className="input"
                required
            />

            {!readOnly && (
                <PasswordField
                    name="password_hash"
                    value={form.password_hash}
                    onChange={handleChange}
                    placeholder={society ? "New Password (optional)" : "Password"}
                    required={!society}
                />
            )}

            {!readOnly && (
                <button className="bg-blue-600 text-white py-2 rounded">
                    {society ? "Update Society Admin" : "Create Society Admin"}
                </button>
            )}

        </form>
    );
};  
export default SocietyAdminForm;
