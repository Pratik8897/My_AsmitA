import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "./UserManagement.css";

const Support = () => {

  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");

  // ✅ MODAL STATE
  const [showModal, setShowModal] = useState(false);

  // ✅ FORM STATE
  const [faqInput, setFaqInput] = useState("");
  const [faqDesc, setFaqDesc] = useState("");

  // ✅ FAQ DATA STATE
  const [faqList, setFaqList] = useState([
    {
      faq: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      desc: "Sample description"
    }
  ]);

  const support = [
    {
      askedby: "Himanshu Sharma",
      society: "AshmitA",
      date: "2023-10-10",
      time: "10:00 AM",
    },
  ];

  // =========================
  // ADD FAQ
  // =========================
  const handleAddFAQ = () => {
    if (!faqInput.trim()) return;

    setFaqList((prev) => [
      ...prev,
      {
        faq: faqInput,
        desc: faqDesc
      }
    ]);

    // reset
    setFaqInput("");
    setFaqDesc("");
    setShowModal(false);
  };

  return (
    <AdminLayout title="Support">
      <div className="user-page">

        {/* TOP BUTTON */}
        <div className="user-actions">
          <button
            className="btn primary"
            onClick={() => setShowModal(true)}
          >
            + Add New FAQ
          </button>
        </div>

        <div className="user-card">

          {/* HEADER */}
          <div className="user-card-header">
            <div className="user-card-top">
              <h2>Support</h2>
              <button
                className="filter-toggle"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>

            <div className={`user-filters${showFilters ? " open" : ""}`}>
              <button
                className={`btn ${activeTab === "faq" ? "active" : ""}`}
                onClick={() => setActiveTab("faq")}
              >
                Frequently Asked Questions
              </button>

              <button
                className={`btn ${activeTab === "support" ? "active" : ""}`}
                onClick={() => setActiveTab("support")}
              >
                Support
              </button>
            </div>
          </div>

          {/* ================= FAQ TABLE ================= */}
          {activeTab === "faq" && (
            <div className="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>FAQ</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {faqList.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.faq}</td>
                      <td>
                        <button className="view-btn">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          {/* ================= SUPPORT TABLE ================= */}
          {activeTab === "support" && (
            <div className="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Asked By</th>
                    <th>Society</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {support.map((user, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{user.askedby}</td>
                      <td>{user.society}</td>
                      <td>{user.date}</td>
                      <td>{user.time}</td>
                      <td>
                        <button className="view-btn">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* ================= MODAL ================= */}
        {showModal && (
          <div className="modal-overlay">

            <div className="modal-box">

              <h3>Add New FAQ</h3>

              <div className="add-user-grid">

                <label className="field">
                  <span>Enter FAQ</span>
                  <input
                    value={faqInput}
                    onChange={(e) => setFaqInput(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Enter Content For Description</span>
                  <textarea
                    value={faqDesc}
                    onChange={(e) => setFaqDesc(e.target.value)}
                  />
                </label>

              </div>

              <div className="add-user-actions">
                <button
                  className="btn ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn primary"
                  onClick={handleAddFAQ}
                >
                  Add
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Support;