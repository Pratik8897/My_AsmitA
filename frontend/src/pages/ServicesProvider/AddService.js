import { useNavigate } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
// import "./AddUser.css";

const AddService = () => {
  const navigate = useNavigate();

  // ✅ State management


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
          

          <div className="add-user-grid">

              <label className="field">
              <span>Select Society</span>
              <select defaultValue="1010">
                <option>Himanshu Sharma</option>
                <option>AsmitA Grand Masion</option>
                <option>AsmitA House</option>
              </select>
            </label>


            <label className="field">
              <span>Enter Service Name</span>
              <input defaultValue="Laundry Service" />
            </label>

            

           

           

         
          </div>

         
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

export default AddService;