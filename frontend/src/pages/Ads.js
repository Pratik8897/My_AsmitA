import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./UserManagement.css";
import { useNavigate } from "react-router-dom";

const users = [
  {
    societyname: "Hiranandani Estate",
    title: "T1",
    slot: "F1",
    uploadedon: "2023-10-10 10:00 AM",
    phone: "+91 857412365",
  },
];

const Ads = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Floor Summary">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-ads")}
          >
            + PUBLISH NEW AD
          </button>

          <button className="btn outline" type="button">
            Export Data In Excel
          </button>
        </div>



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Floor Summary</h2>
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
              {/* <select defaultValue="Service">
                <option>Tower</option>
                <option>T1</option>
                <option>T2</option>
              </select> */}

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
                  <th>Society Name</th>
                  <th>Title</th>
                  <th>Slot</th>
                  <th>Uploaded on</th>
                  <th>Phone Number</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Title">{user.title}</td>
                    <td data-label="Slot">{user.slot}</td>
                    <td data-label="Uploaded on">{user.uploadedon}</td>
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

export default Ads;
