import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useNavigate } from "react-router-dom";
// import "./UserManagement.css";

const users = [
  {
    societyadminname: "Hiranandani Estate",
    societyname: "Hiranandani Estate",
    email: "himanshusharma23@gmail.com",
    phone: "+91 857412365",
  },
];

const SocietyAdmin = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Society Admin">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-admin")}
          >
            + Add Society Admin
          </button>

          <button className="btn outline" type="button">
            Export Data In Excel
          </button>
        </div>



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Society Admin</h2>
              <button
                className="filter-toggle"
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                aria-expanded={showFilters}
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>


            <div className={`user-filters${showFilters ? " open" : ""}`}>
              <select defaultValue="Society">
                <option>Society</option>
                <option>Hiranandani Estate</option>
              </select>
              <select defaultValue="Active Users">
                <option>Active Users</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              
              <div className="user-search">
                <span className="search-icon" aria-hidden="true" />
                <input placeholder="Search by name" />
              </div>

            </div>




          </div>


          {/* Table */}
          <div className="user-table">
            <table>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Society Admin Name</th>
                  <th>Society Name</th>
                  <th>Email ID</th>
                  <th>Phone Number</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Admin Name">{user.societyadminname}</td>
                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Email ID">{user.email}</td>
                    <td data-label="Phone Number">{user.phone}</td>

                    <td data-label="Action">
                      <div className="action-group">
                        <button
                          className="icon-btn edit"
                          type="button"
                          aria-label="Edit"
                        />
                        <button
                          className="icon-btn delete"
                          type="button"
                          aria-label="Delete"
                        />
                        <button className="view-btn" type="button">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};



export default SocietyAdmin;
