import { useEffect, useRef, useState } from "react";

// import "../../ServicesProvider/AddServicesProvider.css";
import "../../pages/ServicesProvider/AddServicesProvider.css";
import "../../pages/Amenities/AddAmenities.css"
import {
  createSociety,
  updateSociety,
} from "../../services/societyService";




const AddAmenity = ({ society, readOnly = false, onSuccess }) => {

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    description: "",
    specilities: "",
    important_instruction: "", // ✅ added
  });

  /* ================= IMAGES ================= */
  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  /* ================= TIMINGS ================= */
  const daysList = [
    "Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday","Sunday"
  ];

  const [timings, setTimings] = useState(
    daysList.map((day) => ({
      day,
      enabled: true,
      start: "09:00",
      end: "22:00",
    }))
  );

  /* ================= SLOTS ================= */
  const [slots, setSlots] = useState([
    {
      slot: "Slot 1",
      enabled: true,
      start: "09:00",
      end: "10:00",
    },
  ]);

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (society) {
      setForm({
        description: society.description || "",
        specilities: society.specilities || "",
        important_instruction: society.important_instruction || "",
      });

      setImages(
        society.images?.map((img) => ({
          file: null,
          preview: img,
        })) || []
      );

      if (society.timings) setTimings(society.timings);
      if (society.slots) setSlots(society.slots);

    } else {
      resetForm();
    }
  }, [society]);

  const resetForm = () => {
    setForm({
      description: "",
      specilities: "",
      important_instruction: "",
    });
    setImages([]);
  };

  /* ================= INPUT ================= */
  const handleChange = (e) => {
    if (readOnly) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= IMAGE ================= */
  const handleFiles = (files) => {
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
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

  /* ================= TIMINGS ================= */
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

  /* ================= SLOTS ================= */
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

  const addSlot = (e) => {
    e.preventDefault();
    setSlots((prev) => [
      ...prev,
      {
        slot: `Slot ${prev.length + 1}`,
        enabled: true,
        start: "09:00",
        end: "10:00",
      },
    ]);
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        timings,
        slots,
        images: images.map((img) => img.file || img.preview),
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

      {/* INPUTS */}


      <input name="description" value={form.description} onChange={handleChange} className="input" placeholder="Description" />

      <input name="specilities" value={form.specilities} onChange={handleChange} className="input" placeholder="Specialties" />

      <input name="important_instruction" value={form.important_instruction} onChange={handleChange} className="input" placeholder="Important Instruction" />

      {/* ================= IMAGE ================= */}
      <h4>Image Upload</h4>
      <div className="image-upload-box"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p>📷 Drag & Drop or Click</p>
        <input type="file" multiple hidden ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="image-preview">
        {images.map((img, i) => (
          <div key={i} className="preview-card">
            <img src={img.preview} alt="" />
            <button type="button" onClick={() => handleRemoveImage(i)}>✕</button>
          </div>
        ))}
      </div>

      {/* ================= TIMINGS ================= */}
      <div className="timings-section">
        <h4>Timings</h4>
        {timings.map((item, index) => (
          <div key={item.day} className="timing-row">

            <div className="day">{item.day}</div>

            <input type="time"
              value={item.start}
              disabled={!item.enabled}
              onChange={(e) => updateTime(index, "start", e.target.value)}
            />

            <input type="time"
              value={item.end}
              disabled={!item.enabled}
              onChange={(e) => updateTime(index, "end", e.target.value)}
            />

            <input type="checkbox"
              checked={item.enabled}
              onChange={() => toggleDay(index)}
            />
          </div>
        ))}
      </div>

      {/* ================= SLOTS ================= */}
      <div className="timings-section">
        <h4>Time Slots</h4>

        {slots.map((item, index) => (
          <div key={index} className="timing-row">

            <div className="day">{item.slot}</div>

            <input type="time"
              value={item.start}
              disabled={!item.enabled}
              onChange={(e) => updateSlot(index, "start", e.target.value)}
            />

            <input type="time"
              value={item.end}
              disabled={!item.enabled}
              onChange={(e) => updateSlot(index, "end", e.target.value)}
            />

            <input type="checkbox"
              checked={item.enabled}
              onChange={() => toggleSlot(index)}
            />

            {slots.length > 1 && (
              <button type="button" onClick={() => removeSlot(index)}>
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addSlot}>
          + Add Slot
        </button>
      </div>

      {!readOnly && (
        <button className="bg-blue-600 text-white py-2 rounded">
          {society ? "Update Amenity" : "Create Amenity"}
        </button>
      )}

    </form>
  );
};

export default AddAmenity;