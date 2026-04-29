import { useEffect, useState } from "react";
import {
  createSociety,
  updateSociety,
} from "../../services/societyService";

const SocietyServiceForm = ({ society, readOnly = false, onSuccess }) => {
  const [form, setForm] = useState({
    service: "",
    society_name: "",
   
  });

  // 🔥 Populate for edit/view
  useEffect(() => {
    if (society) {
      setForm({
        services: society.service || "",
        society_name: society.society_name || "",
      });
      return;
    }

    setForm({
      service: "",
    society_name: "",
    });
  }, [society]);

  const handleChange = (e) => {
    if (readOnly) return;

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (society) {
        await updateSociety(society.society_id, form);
      } else {
        await createSociety(form);
      }

      onSuccess();
      } catch (err) {
        console.error(err);
      }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3"> 
         
       <input
        name="service"
        value={form.service}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Service"
        className="input"
        required
      />
 
      <input
        name="society_name"
        value={form.society_name}
        onChange={handleChange}
        disabled={readOnly}
        placeholder="Society Name"
        className="input"
        required
      />

      
      {!readOnly && (
        
        <button className="bg-blue-600 text-white py-2 rounded">
          {society ? "Update Society" : "Create Society"}
        </button>

      )}


    </form>
  );
};

export default SocietyServiceForm;
