import { useEffect, useState } from "react";
import {
    createSociety,
    updateSociety,
} from "../../services/SocietyAdminServices";

const SocietyAdminForm = ({ society, readOnly = false, onSuccess }) => {
    const [form, setForm] = useState({
        society_admin_name: "",
        society_name: "",
        email: "",
        phone: "",
    });

    // 🔥 Populate for edit/view
    useEffect(() => {
        if (society) {
            setForm({
                society_admin_name: society.society_admin_name || "",
                society_name: society.society_name || "",
                email: society.email || "",
                phone: society.phone || "",
            });
            return;
        }

        setForm({
            society_admin_name: "",
            society_name: "",
            email: "",
            phone: "",
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
                name="society_admin_name"
                value={form.society_admin_name}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Society Admin Name"
                className="input"
                required
            />
            <input
                name="society_name"
                value={form.society_name}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Society Name"
                className="input"
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
            />

            <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={readOnly}
                placeholder="Phone"
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
export default SocietyAdminForm;
