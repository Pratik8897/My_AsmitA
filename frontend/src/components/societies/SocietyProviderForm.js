import { useEffect, useState } from "react";
// import "../../ServicesProvider/AddServicesProvider.css";
import "../../pages/ServicesProvider/AddServicesProvider.css"
import {
  createSociety,
  updateSociety,
} from "../../services/societyService";

const SocietyProviderForm = ({ society, readOnly = false, onSuccess }) => {

  const [form, setForm] = useState({
    service_provider: "",
    society_name: "",
    phone: "",
    select_service: "",
    description: "",
    specilities: "",

  });

  const daysList = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const [timings, setTimings] = useState(() =>
    daysList.map((day) => ({
      day,
      enabled: true,
      start: "09:00",
      end: "22:00"
    }))
  );

  // ✅ Populate form (FIXED)
  useEffect(() => {
    if (society) {
      setForm({
          service_provider: society.service_provider || "",
        society_name: society.society_name || "",
        phone: society.phone || "",
        select_service: society.select_service || "",
        description: society.description || "",
        specilities: society.specilities || "",
      });
    } else {
      setForm({
        service_provider: "",
        society_name: "",
        phone: "",
        select_service: "",
        description: "",
        specilities: "",
      });
    }
  }, [society]);

  // ✅ Handle input
  const handleChange = (e) => {
    if (readOnly) return;

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Update time
  const updateTime = (index, field, value) => {
    setTimings((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // ✅ Toggle day
  const toggleDay = (index) => {
    setTimings((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  // ✅ SINGLE submit (FIXED)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        timings, // 👈 include timings
      };

      if (society) {
        await updateSociety(society.society_id, payload);
      } else {
        await createSociety(payload);
      }

      onSuccess && onSuccess();

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      <input
        name="service_provider"
        value={form.service_provider}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Service Provider"
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
        type="tel"
        name="phone"
        value={form.phone || ""}
        onChange={(e) => {
          const onlyNums = e.target.value.replace(/[^0-9]/g, "");
          handleChange({
            ...e,
            target: {
              ...e.target,
              name: "phone",
              value: onlyNums,
            },
          });
        }}
        disabled={readOnly}
        placeholder="Phone"
        className="input"
        required
        maxLength={10}
      />

           <input
        name="select_service"
        value={form.select_service}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Select Service"
        className="input"
        required
      />

       <input
        name="description"
        value={form.description}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Description"
        className="input"
        required
      />

      <input
        name="specilities"
        value={form.specilities}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Specialties"
        className="input"
        required
      />


      {/* TIMINGS */}
      <div className="timings-section">
        <h4>Timings</h4>


        {timings.map((item, index) => (
          <div key={item.day} className="timing-row">

            <div className="day">{item.day}</div>

            <div className="time-box">
              <input
                type="time"
                value={item.start}
                disabled={item.enabled}
                onChange={(e) =>
                  updateTime(index, "start", e.target.value)
                }
              />

              <input
                type="time"
                value={item.end}
                disabled={item.enabled}
                onChange={(e) =>
                  updateTime(index, "end", e.target.value)
                }
              />
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => toggleDay(index)}
              />
              <span className="slider"></span>
            </label>

          </div>
        ))}
      </div>

      {!readOnly && (
        <button className="bg-blue-600 text-white py-2 rounded">
          {society ? "Update Society" : "Create Society"}
        </button>
      )}

    </form>
  );
};

export default SocietyProviderForm;