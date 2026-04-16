import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "./AddUser.css";
import "./AddAmenities.css";


const AddAmenity = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    // =========================
    // DAYS
    // =========================
    const daysList = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    // =========================
    // STATE
    // =========================
    const [images, setImages] = useState([]);

    const [timings, setTimings] = useState(() =>
        daysList.map((day) => ({
            day,
            enabled: true,
            start: "09:00",
            end: "22:00"
        }))
    );

    const [slots, setSlots] = useState([
        {
            slot: "Slot 1",
            enabled: true,
            start: "09:00",
            end: "22:00"
        }
    ]);

    // =========================
    // IMAGE HANDLING
    // =========================
    const handleFiles = (files) => {
        const fileArray = Array.from(files);

        const newImages = fileArray.map((file) => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setImages((prev) => [...prev, ...newImages]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // =========================
    // TIMINGS
    // =========================
    const updateTime = (index, field, value) => {
        setTimings((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const toggleDay = (index) => {
        setTimings((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    // =========================
    // SLOTS
    // =========================
    const updateSlot = (index, field, value) => {
        setSlots((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const toggleSlot = (index) => {
        setSlots((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    const addSlot = () => {
        setSlots((prev) => [
            ...prev,
            {
                slot: `Slot ${prev.length + 1}`,
                enabled: true,
                start: "09:00",
                end: "22:00"
            }
        ]);
    };

    const removeSlot = (index) => {
        setSlots((prev) => prev.filter((_, i) => i !== index));
    };

    // =========================
    // SUBMIT
    // =========================
    const handleSubmit = () => {
        console.log("Images:", images);
        console.log("Timings:", timings);
        console.log("Slots:", slots);
    };


    return (
        <AdminLayout title="Add Amenity">
            <div className="add-user-page" ref={containerRef}>

                {/* HEADER */}
                {/* <div className="add-user-header">
                    <div className="add-user-avatar">
                        <img
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
                            alt="User profile"
                        />
                        <button className="avatar-upload" type="button">
                            <span className="upload-icon" />
                        </button>
                    </div>
                </div> */}

                {/* Top Buttons */}
                <div className="user-actions">
                    <button
                        className="btn btn outline"
                        type="button"
                        onClick={() => navigate("/amenities")}
                    >
                        ✏️ Edit Amenity
                    </button>

                    
                </div>

                <div className="add-user-card">

                    {/* FORM */}
                    <div className="add-user-grid">

                        <label className="field">
                            <span>Description</span>
                            <textarea defaultValue="Ad Title"></textarea>
                        </label>

                        <label className="field">
                            <span>Service Details</span>
                            <textarea></textarea>
                        </label>

                        <label className="field">
                            <span>Important Instructions</span>
                            <textarea></textarea>
                        </label>

                    </div>

                    {/* ================= IMAGE UPLOAD ================= */}

                    <h4>Image Upload</h4>
                    <div
                        className="image-upload-box"
                        onClick={() => fileInputRef.current.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >


                        <p>📷 Drag & Drop or Click to Upload</p>

                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            hidden
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </div>

                    {/* PREVIEW */}
                    <div className="image-preview">
                        {images.map((img, index) => (
                            <div key={index} className="preview-card">
                                <img src={img.preview} alt="preview" />
                                <button onClick={() => handleRemoveImage(index)}>✕</button>
                            </div>
                        ))}
                    </div>


                    {/* ========================= TIMINGS ========================= */}
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

                    {/* ========================= SLOTS ========================= */}
                    <div className="timings-section">
                        <h4>Time Slots</h4>

                        {slots.map((item, index) => (
                            <div key={item.slot} className="timing-row">

                                <div className="day">{item.slot}</div>

                                <div className="time-box">
                                    <input
                                        type="time"
                                        value={item.start}
                                        disabled={item.enabled}
                                        onChange={(e) =>
                                            updateSlot(index, "start", e.target.value)
                                        }
                                    />

                                    <input
                                        type="time"
                                        value={item.end}
                                        disabled={item.enabled}
                                        onChange={(e) =>
                                            updateSlot(index, "end", e.target.value)
                                        }
                                    />
                                </div>

                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={item.enabled}
                                        onChange={() => toggleSlot(index)}
                                    />
                                    <span className="slider"></span>
                                </label>

                                {/* REMOVE BUTTON */}
                                {slots.length > 1 && (
                                    <button
                                        className="btn small danger"
                                        onClick={() => removeSlot(index)}
                                    >
                                        Remove
                                    </button>
                                )}

                            </div>
                        ))}

                        {/* ADD SLOT BUTTON */}
                        <button className="btn secondary" onClick={addSlot}>
                            + Add Slot
                        </button>

                    </div>

                </div>

                {/* ACTIONS */}
                <div className="add-user-actions">
                    <button className="btn ghost" onClick={() => navigate(-1)}>
                        Cancel
                    </button>

                    <button className="btn primary" onClick={handleSubmit}>
                        Add
                    </button>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AddAmenity;