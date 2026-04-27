import { useEffect, useState } from "react";
// import "../../ServicesProvider/AddServicesProvider.css";
// import "../../pages/ServicesProvider/AddServicesProvider.css"
import {
//   createSociety,
//   updateSociety,
} from "../../services/societyService";

const AddFaq = ({ society, readOnly = false, onSuccess }) => {

  const [form, setForm] = useState({
    faq_title: "",
    faq_content: "",

  });



 

  // ✅ Populate form (FIXED)
  useEffect(() => {
    if (society) {
      setForm({
          faq_title: society.faq_title || "",
        faq_content: society.faq_content || "",
      });
    } else {
      setForm({
        faq_title: "",
        faq_content: "",
      });
    }
  }, [society]);

  // ✅ Handle input
  const handleChange = (e) => {
    if (readOnly) return;

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };



  
  

  return (
    <form className="flex flex-col gap-3">

      <input
        name="faq_title"
        value={form.faq_title}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="FAQ Title"
        className="input"
        required
      />

      <input
        name="faq_content"
        value={form.faq_content}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="FAQ Content"
        className="input"
        required
      />
     

      

      {!readOnly && (
        <button className="bg-blue-600 text-white py-2 rounded">
          {society ? "Update FAQ" : "Create FAQ"}
        </button>
      )}

    </form>
  );
};

export default AddFaq;