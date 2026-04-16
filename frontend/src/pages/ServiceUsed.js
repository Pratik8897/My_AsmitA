import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./UserManagement.css";
// import { useNavigate } from "react-router-dom";

const users = [
  {
    societyname: "Hiranandani Estate",
    servicename: "Laundry Service",
    usedby: "Hiranandani Estate",
    provider: "Himanshu Sharma",
    phone: "+91 857412365",
    datetime: "2023-10-10 10:00 AM",
    
  },
];

const ServiceUsed = () => {
  // const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Services Providers">
      <div className="user-page">

        {/* Top Buttons */}
        {/* <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-service-provider")}
          >
            + Add New Service Provider
          </button>

          <button className="btn outline" type="button">
            Export Data In Excel
          </button>
        </div> */}



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Services Providers</h2>
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
                <option>Service</option>
                <option>Laundry Service</option>
                <option>Clearing Service</option>
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
                  <th>Service Name</th>
                  <th>Used By</th>
                  <th>Provider</th>
                  <th>Phone Number</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Service Name">{user.servicename}</td>
                    <td data-label="Used By">{user.usedby}</td>
                    <td data-label="Provider">{user.provider}</td>
                    <td data-label="Phone Number">{user.phone}</td>
                    <td data-label="Date & Time">{user.datetime}</td>

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




export default ServiceUsed;
