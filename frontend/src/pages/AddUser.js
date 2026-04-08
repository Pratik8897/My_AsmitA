import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./AddUser.css";

const AddUser = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Add User">
      <div className="add-user-page">
        <div className="add-user-header">
          <div className="add-user-avatar">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=220&q=80"
              alt="User profile"
            />
            <button className="avatar-upload" type="button" aria-label="Upload">
              <span className="upload-icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="add-user-card">
          <div className="add-user-row">
            <label className="field">
              <span>Society</span>
              <select defaultValue="Hiranandani Estate">
                <option>Hiranandani Estate</option>
                <option>Highlands</option>
                <option>Lake View</option>
              </select>
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

            <button className="add-flat" type="button" aria-label="Add flat">
              +
            </button>
          </div>

          <div className="add-user-grid">
            <label className="field">
              <span>Full Name</span>
              <input defaultValue="Himanshu Sharma" />
            </label>

            <label className="field">
              <span>Email ID</span>
              <input defaultValue="himanshusharma23@gmail.com" />
            </label>

            <label className="field">
              <span>Gender</span>
              <select defaultValue="Male">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>

            <label className="field">
              <span>Mobile No</span>
              <input defaultValue="+966 8471253689" />
            </label>

            <label className="field">
              <span>Type</span>
              <select defaultValue="Tenet">
                <option>Tenet</option>
                <option>Owner</option>
              </select>
            </label>
          </div>

          <div className="add-user-actions">
            <button className="btn ghost" type="button" onClick={() => navigate(-1)}>
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

export default AddUser;
