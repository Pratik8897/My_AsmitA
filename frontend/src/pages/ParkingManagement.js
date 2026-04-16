import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "./UserManagement.css";
import { useNavigate } from "react-router-dom";

const users = [
  {
    societyname: "Hiranandani Estate",
    parkingslot: "P1",
    parkingtype: "Car",
    flat: "1001",
  },
];

const ParkingManagement = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Parking Management">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-parking-slot")}
          >
            + Create Parking Slot
          </button>

          <button className="btn outline" type="button" onClick={() => navigate("/assign-parking-slot")}>
            Assign Parking Slot
          </button>
        </div>



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Parking Management</h2>
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
                  <th>Parking Slot</th>
                  <th>Parking Type</th>
                  <th>Flat</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Parking Slot">{user.parkingslot}</td>
                    <td data-label="Parking Type">{user.parkingtype}</td>
                    <td data-label="Flat">{user.flat}</td>
                    <td data-label="Action">
                      <div className="action-group">
                        <button
                          className="icon-btn edit"
                          type="button"
                          aria-label="Edit"
                        />
                        {/* <button
                          className="icon-btn delete"
                          type="button"
                          aria-label="Delete"
                        />
                        <button className="view-btn" type="button">
                          View
                        </button> */}
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




export default ParkingManagement;
