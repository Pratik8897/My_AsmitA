import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "./AddUser.css";
// import "./AddServicesProvider.css";
// import "./ServicesProvider.css";


const AddServicesProvider = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // =========================
  // DAYS
  // =========================
  const daysList = [
    "Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday","Sunday"
  ];

  // =========================
  // STATE (OPTIMIZED INIT)
  // =========================
  const [timings, setTimings] = useState(() =>
    daysList.map((day) => ({
      day,
      enabled: true, // true = LOCKED
      start: "09:00",
      end: "22:00"
    }))
  );

  // =========================
  // UPDATE TIME (SAFE IMMUTABLE)
  // =========================
  const updateTime = (index, field, value) => {
    setTimings((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // =========================
  // TOGGLE DAY
  // =========================
  const toggleDay = (index) => {
    setTimings((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = () => {
    console.log("FINAL DATA:", timings);

    // 👉 API CALL READY STRUCTURE
    // axios.post("/api/provider", { timings })
  };

  return (
    <AdminLayout title="Add User">

      <div className="add-user-page" ref={containerRef}>

        {/* HEADER */}
        <div className="add-user-header">
          <div className="add-user-avatar">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
              alt="User"
            />
            <button className="avatar-upload" type="button">
              +
            </button>
          </div>
        </div>

        <div className="add-user-card">

          {/* FORM ROW */}
          <div className="add-user-row services-provider-row">
            <label className="field">
              <span>Service Provider Name</span>
              <input defaultValue="Himanshu Sharma" />
            </label>

            <label className="field">
              <span>Select Society</span>
              <select defaultValue="Hiranandani Estate">
                <option>Hiranandani Estate</option>
              </select>
            </label>

            <label className="field">
              <span>Select Tower</span>
              <select defaultValue="Tower A">
                <option>Tower A</option>
                <option>Tower B</option>
                <option>Tower C</option>
              </select>
            </label>

            <label className="field">
              <span>Select Service</span>
              <select defaultValue="Laundry Service">
                <option>Laundry Service</option>
              </select>
            </label>

            <button className="add-flat" type="button">+</button>
          </div>

          {/* GRID */}
          <div className="add-user-grid">
            <label className="field">
              <span>Mobile No</span>
              <input defaultValue="+91 9876543210" />
            </label>

            <label className="field">
              <span>Email</span>
              <input defaultValue="example@gmail.com" />
            </label>

            <label className="field">
              <span>Description</span>
              <input defaultValue="Text description" />
            </label>

            <label className="field">
              <span>Specialization</span>
              <input defaultValue="Laundry expert" />
            </label>
          </div>

          {/* =========================
              TIMINGS SECTION (OPTIMIZED)
          ========================= */}
          <div className="timings-section ">
            <h4>Timings</h4>

            {timings.map((item, index) => (
              <div key={item.day} className="timing-row">

                {/* DAY */}
                <div className="day">{item.day}</div>

                {/* TIME */}
                <div className="time-box">

                  <input
                    type="time"
                    value={item.start}
                    disabled={item.enabled} // LOCK WHEN TRUE
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

                {/* TOGGLE */}
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

          {/* ACTIONS */}
          <div className="add-user-actions">
            <button
              className="btn ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button
              className="btn primary"
              onClick={handleSubmit}
            >
              Add
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AddServicesProvider;