import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useNavigate } from "react-router-dom";
// import "./UserManagement.css";
import "./AddServicesProvider.css";

const users = [
  {
    societyadminname: "Hiranandani Estate",
    societyname: "Hiranandani Estate",
    email: "himanshusharma23@gmail.com",
    phone: "+91 857412365",
  },
];

const ServicesProviders = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSociety, setSelectedSociety] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const filteredUsers = users.filter((user) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch =
      !searchText ||
      [user.societyadminname, user.societyname, user.email, user.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchText));

    const matchesSociety =
      !selectedSociety || user.societyname === selectedSociety;
    const matchesService =
      !selectedService || user.societyadminname === selectedService;

    return matchesSearch && matchesSociety && matchesService;
  });


  return (
    <AdminLayout title="Services Providers">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
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
        </div>



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
              <select
                value={selectedSociety}
                onChange={(e) => setSelectedSociety(e.target.value)}
              >
                <option value="">Society</option>
                <option value="Hiranandani Estate">Hiranandani Estate</option>
              </select>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">Service</option>
                <option value="Laundry Service">Laundry Service</option>
                <option value="Clearing Service">Clearing Service</option>
              </select>
              
              <div className="user-search">
                <span className="search-icon" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name"
                />
              </div>

            </div>




          </div>


          {/* Table */}
          <div className="user-table">
            <table>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Service Provider Name</th>
                  <th>Service Name</th>
                  <th>Society Name</th>
                  <th>Phone Number</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Service Provider Name">{user.societyadminname}</td>
                    <td data-label="Service Name">{user.societyname}</td>
                    <td data-label="Society Name">{user.email}</td>
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




export default ServicesProviders;
