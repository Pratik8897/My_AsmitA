import AdminLayout from "../components/AdminLayout";
import { useNavigate } from "react-router-dom";

const users = [
  {
    society: "Hiranandani Estate",
    city: "Mumbai",
    state: "Maharastra",
    country: "India",
    name: "Himanshu Sharma",
    email: "himanshusharma23@gmail.com",
    phone: "+91 857412365",
  },
];

const SocietyManagement = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Society Management">
      <div className="user-page">

        {/* Top Buttons */}
        <div className="user-actions">
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/add-society")}
          >
            + Add Society
          </button>

          <button className="btn outline" type="button">
            Export Data In Excel
          </button>
        </div>

        {/* Table */}
        <div className="user-table">
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Society</th>
                <th>City</th>
                <th>State</th>
                <th>Country</th>
                <th>Name</th>
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

                  <td data-label="Society">{user.society}</td>
                  <td data-label="City">{user.city}</td>
                  <td data-label="State">{user.state}</td>
                  <td data-label="Country">{user.country}</td>
                  <td data-label="Name">{user.name}</td>
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
    </AdminLayout>
  );
};

export default SocietyManagement;