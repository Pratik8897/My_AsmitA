import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./UserManagement.css";

const stats = [
  { label: "Total Users", value: "5k+", helper: "" },
  { label: "In-active Users", value: "121", helper: "Not used app since 30days" },
];

const users = [
  {
    society: "Hiranandani Estate",
    tower: "T1",
    floor: "10",
    flat: "1010",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    os: "Android",
    phone: "+91 857412365",
    type: "Owner",
  },
  {
    society: "Hiranandani Estate",
    tower: "T1",
    floor: "10",
    flat: "1010",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    os: "iOS",
    phone: "+91 857412365",
    type: "Tenet",
  },
  {
    society: "Hiranandani Estate",
    tower: "T1",
    floor: "10",
    flat: "1010",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    os: "Android",
    phone: "+91 857412365",
    type: "Owner",
  },
  {
    society: "Hiranandani Estate",
    tower: "T1",
    floor: "10",
    flat: "1010",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    os: "iOS",
    phone: "+91 857412365",
    type: "Owner",
  },
  {
    society: "Hiranandani Estate",
    tower: "T1",
    floor: "10",
    flat: "1010",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    os: "Android",
    phone: "+91 857412365",
    type: "Tenet",
  },
];

const UserManagement = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <AdminLayout title="User Management">
      <div className="user-page">
        <div className="user-summary">
          {stats.map((stat) => (
            <div className="user-stat" key={stat.label}>
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              {stat.helper ? <span>{stat.helper}</span> : null}
            </div>
          ))}

          <div className="user-actions">
            <button
              className="btn primary"
              type="button"
              onClick={() => navigate("/add-user")}
            >
              + Add New User
            </button>
            <button className="btn danger" type="button">
              + Add User In Bulk
            </button>
            <button className="btn outline" type="button">
              Export Data In Excel
            </button>
          </div>
        </div>

        <div className="user-card">
          <div className="user-card-header">
            <div className="user-card-top">
              <h2>User Management</h2>
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
              <select defaultValue="Tower">
                <option>Tower</option>
                <option>T1</option>
              </select>
              <select defaultValue="Floor">
                <option>Floor</option>
                <option>10</option>
              </select>
              <select defaultValue="OS-Type">
                <option>OS-Type</option>
                <option>Android</option>
                <option>iOS</option>
              </select>
              <select defaultValue="Ownership Type">
                <option>Ownership Type</option>
                <option>Owner</option>
                <option>Tenet</option>
              </select>
              <select defaultValue="Active Users">
                <option>Active Users</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="user-search">
              <span className="search-icon" aria-hidden="true" />
              <input placeholder="Search by name" />
            </div>
          </div>

          <div className="user-table">
            <table>
              <thead>
                <tr>
                  <th>Society</th>
                  <th>Tower</th>
                  <th>Floor</th>
                  <th>Flat</th>
                  <th>Name</th>
                  <th>Email ID</th>
                  <th>OS Type</th>
                  <th>Phone Number</th>
                  <th>Ownership Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>
                    <td data-label="Society">{user.society}</td>
                    <td data-label="Tower">{user.tower}</td>
                    <td data-label="Floor">{user.floor}</td>
                    <td data-label="Flat">{user.flat}</td>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Email ID">{user.email}</td>
                    <td data-label="OS Type">{user.os}</td>
                    <td data-label="Phone Number">{user.phone}</td>
                    <td data-label="Ownership Type">{user.type}</td>
                    <td data-label="Action">
                      <div className="action-group">
                        <button className="icon-btn edit" type="button" aria-label="Edit" />
                        <button className="icon-btn delete" type="button" aria-label="Delete" />
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

export default UserManagement;
