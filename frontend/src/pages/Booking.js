import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./UserManagement.css";
import { useNavigate } from "react-router-dom";

const users = [
  {
    societyname: "Hiranandani Estate",
    bookingby: "John Doe",
    amenitybooked: "Swimming Pool",
    bookingdate: "2023-10-01",
    bookingtime: "10:00am - 11:00am",
    availableflats: 20,
  },
];

const Booking = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);


  return (
    <AdminLayout title="Booking">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/booking")}
          >
            Pending Booking
          </button>

          <button className="btn outline" type="button">
            Upcoming Booking
          </button>
        </div>



        <div className="user-card">


          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Booking</h2>
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
              {/* <select defaultValue="Society">
                <option>Society</option>
                <option>Hiranandani Estate</option>
              </select>
              <select defaultValue="Service">
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
                  <th>Booked By</th>
                  <th>Amenity Booked</th>
                  <th>Booking Date</th>
                  <th>Booking Time</th>
                  <th>Available Flats</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={`${user.email}-${index}`}>

                    {/* ✅ Sr No */}
                    <td data-label="Sr No">{index + 1}</td>

                    <td data-label="Society Name">{user.societyname}</td>
                    <td data-label="Booked By">{user.bookingby}</td>
                    <td data-label="Amenity Booked">{user.amenitybooked}</td>
                    <td data-label="Booking Date">{user.bookingdate}</td>
                    <td data-label="Booking Time">{user.bookingtime}</td>
                    <td data-label="Available Flats">{user.availableflats}</td>

                    <td data-label="Action">
                      <div className="action-group">
                        {/* <button
                          className="icon-btn edit"
                          type="button"
                          aria-label="Edit"
                        />*/}
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



export default Booking;
