import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import "./AddUser.css";

const AddAds = () => {
    const navigate = useNavigate();

    return (
        <AdminLayout title="Add Ads">
            <div className="add-user-page">
                <div className="add-user-header">
                    <div className="add-user-avatar">
                        <img
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=220&q=80"
                            alt="User profile"
                        />
                        <button className="avatar-upload" type="button" aria-label="Upload">
                            <span className="upload-icon" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className="add-user-card">
                    {/* <div className="add-user-row">
            <label className="field">
              <span>Add Title*</span>
                <input defaultValue="Ad Title"  required/>
            </label>

            <label className="field">
              <span>Tower</span>
              <select defaultValue="T1">
                <option>T1</option>
                <option>T2</option>
                <option>T3</option>
              </select>
            </label>

            <label className="field">
              <span>Flat</span>
              <select defaultValue="1010">
                <option>1010</option>
                <option>1020</option>
                <option>2030</option>
              </select>
            </label>

            <button className="add-flat" type="button" aria-label="Add flat">
              +
            </button>
          </div> */}

                    <div className="add-user-grid">
                        <label className="field">
                            <span>Add Title*</span>
                            <input defaultValue="Ad Title" required />
                        </label>


                        <label className="field">
                            <span>Publish Date</span>
                            <input type="date" name="date">
                            </input>

                        </label>

                        <label className="field">
                            <span>Publish Time</span>
                            <input type="time" name="time">
                            </input>
                        </label>

                        <label className="field">
                            <span>Banner URL</span>
                            <input type="url" name="bannerUrl">
                            </input>

                        </label>

                        <label className="field">
                            <span>Select Society</span>
                            <select defaultValue="Hiranandani Estate">
                                <option>Hiranandani Estate</option>
                            </select>
                        </label>

                        <label className="field">
                            <span>Select Place</span>
                            <select defaultValue="Mumbai">
                                <option>Mumbai</option>
                                <option>Pune</option>
                                <option>Delhi</option>
                            </select>
                        </label>


                        <label className="field">
                            <span>Mobile No</span>
                            <input defaultValue="+966 8471253689" />
                        </label>
                         
                         <div className="add-user-row">
                        <label className="field">
                            <span>Closed Date:</span>
                            <input type="date" name="closed_date" />
                        </label>

                        <label className="field">
                            <span>Closed Time:</span>
                            <input type="time" name="closed_time">
                            </input>

                        </label>
                        </div>
                    </div>

                    <div className="add-user-actions">
                        <button className="btn ghost" type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button className="btn primary" type="button">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AddAds;
