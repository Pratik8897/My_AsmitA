import { useNavigate } from "react-router-dom";
// import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import "./AddUser.css";

const AddAdmin = () => {
  const navigate = useNavigate();
//   const [showFilters, setShowFilters] = useState(false);

 

  return (
    <AdminLayout title="Add Society Admin">
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
              
                <span>Society</span>
              <select defaultValue="Society">
                <option>Society</option>
                <option>Hiranandani Estate</option>
              </select>

            

            </label>


            <label className="field">
              <span>Full Name</span>
              <input defaultValue="Hismanshu Sharma" />
            </label>

            <label className="field">
              <span>Email ID</span>
              <input defaultValue="example@gmail.com" />
            </label>

             <label className="field">
              <span>Mobile No</span>
              <input defaultValue="+91 9876543210" />
            </label>

            <label className="field">
              <span>Username Name</span>
              <input defaultValue="hismanshu_sharma" />
            </label>

            <label className="field">
              <span>Password</span>
              <input defaultValue="********" />
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

export default AddAdmin;