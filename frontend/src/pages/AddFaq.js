import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import "./AddUser.css";

const AddFaq = () => {
    const navigate = useNavigate();

    return (
        <AdminLayout title="FAQ">
            <div className="add-user-page">
                <div className="add-user-header">

                </div>

                <div className="add-user-card">


                    <div className="add-user-grid">

                        <label className="field">
                            <span>Enter FAQ</span>
                            <input defaultValue="Lorem Ipsum is simply dummy text of the printing and typesetting industry. " />
                        </label>


                        <label className="field">
                            <span>Enter Content For Description</span>
                            <textarea defaultValue="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."></textarea>
                        </label>
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


        </AdminLayout >
    );
};

export default AddFaq;
