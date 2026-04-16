import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./UserManagement.css";
// import { useNavigate } from "react-router-dom";

const users = [
  {
    societyname: "Hiranandani Estate",
    tower: "T1",
    floor: "F1",
    totalflats: 100,
    occupiedflats: 80,
    availableflats: 20,
  },
];

const FloorSummary = () => {
  // const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Floor Summary">
      <div className="user-page">

        {/* Top Buttons */}
         <div className="user-actions">
          {/* <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-service-provider")}
          >
            + Add New Service Provider
          </button> */}

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
              <select defaultValue="Service">
                <option>Tower</option>
                <option>T1</option>
                <option>T2</option>
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
                  <th>Society Name</th>
                  <th>Tower</th>
                  <th>Floor</th>
                  <th>Total Flats</th>
                  <th>Occupied Flats</th>
                  <th>Available Flats</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Tower">{user.tower}</td>
                    <td data-label="Floor">{user.floor}</td>
                    <td data-label="Total Flats">{user.totalflats}</td>
                    <td data-label="Occupied Flats">{user.occupiedflats}</td>
                    <td data-label="Available Flats">{user.availableflats}</td>

                    <td data-label="Action">
                      <div className="action-group">
                        {/* <button
                          className="icon-btn edit"
                          type="button"
                          aria-label="Edit"
                        />
                        <button
                          className="icon-btn delete"
                          type="button"
                          aria-label="Delete"
                        /> */}
                        {/* <button className="view-btn" type="button">
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






export default FloorSummary;
