import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import "./AddUser.css";

const AddAdmin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

 

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
              <input type="email" defaultValue="example@gmail.com" />
            </label>

             <label className="field">
              <span>Mobile No</span>
              <input type="tel" inputMode="numeric" defaultValue="9876543210" />
            </label>

            <label className="field">
              <span>Username Name</span>
              <input defaultValue="hismanshu_sharma" />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  defaultValue="********"
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 text-xs font-medium text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
