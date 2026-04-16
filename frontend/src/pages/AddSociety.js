import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "./AddUser.css";

const AddSociety = () => {
  const navigate = useNavigate();

  // ✅ State management
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");

  // ✅ Full address for map
  const fullAddress = `${address}, ${city}, ${state}, ${pincode}`;

  return (
    <AdminLayout title="Add User">
      <div className="add-user-page">
        <div className="add-user-header">
          <div className="add-user-avatar">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=220&q=80"
              alt="User profile"
            />
            <button className="avatar-upload" type="button">
              <span className="upload-icon" />
            </button>
          </div>
        </div>

        <div className="add-user-card">
          <div className="add-user-row">
            <label className="field">
              <span>Society Name</span>
              <input defaultValue="AsmitA Grand Masion" />
            </label>

            <label className="field">
              <span>Tower</span>
              <select defaultValue="T1">
                <option>T1</option>
                <option>T2</option>
                <option>T3</option>
              </select>
            </label>

            <label className="field">
              <span>Flat</span>
              <select defaultValue="1010">
                <option>1010</option>
                <option>1020</option>
                <option>2030</option>
              </select>
            </label>

            <button className="add-flat" type="button">
              +
            </button>
          </div>

          <div className="add-user-grid">
            <label className="field">
              <span>Mobile No</span>
              <input defaultValue="+91 9876543210" />
            </label>

            <label className="field">
              <span>Contact Email ID</span>
              <input defaultValue="example@gmail.com" />
            </label>

            <label className="field">
              <span>Country</span>
              <input defaultValue="India" />
            </label>

            <label className="field">
              <span>State</span>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </label>

            <label className="field">
              <span>City</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            {/* ✅ PinCode validation */}
            <label className="field">
              <span>PinCode</span>
              <input
                value={pincode}
                maxLength={6}
                inputMode="numeric"
                placeholder="Enter 6 digit pincode"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPincode(value);
                }}
              />
            </label>

            {/* ✅ Address field */}
            <label className="field full-width">
              <span>Address</span>
              <input
                type="text"
                placeholder="Enter full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          </div>

          {/* ✅ Google Map Preview */}
          {address && (
            <div style={{ marginTop: "20px" }}>
              <iframe
                title="map"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: "10px" }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  fullAddress
                )}&output=embed`}
              ></iframe>
            </div>
          )}

          <div className="add-user-actions">
            <button
              className="btn ghost"
              type="button"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button className="btn primary" type="button">
              Add
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddSociety;