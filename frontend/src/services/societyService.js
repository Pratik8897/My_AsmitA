import api from "./api";
import { toast } from "react-toastify";

/* ---------- COMMON ERROR HANDLER ---------- */
const handleError = (err, label) => {
  console.error(label, err);

  const message =
    err.response?.data?.error ||
    err.message ||
    "Something went wrong";

  toast.error(message);

  // 🔥 IMPORTANT: always throw
  throw new Error(message);
};

/* ---------- SUCCESS HANDLER ---------- */
const handleSuccess = (message) => {
  toast.success(message);
};

/* ---------- GET SOCIETIES ---------- */
export const getSocieties = async (search = "") => {
  try {
    const res = await api.get("/societies", {
      params: search ? { search } : undefined,
    });
    return res.data;
  } catch (err) {
    handleError(err, "GET SOCIETIES ERROR");
  }
};

/* ---------- CREATE SOCIETY ---------- */
export const createSociety = async (data) => {
  try {
    const res = await api.post("/societies", data);

    // ✅ only success toast here
    handleSuccess("Society created successfully");

    return res.data;
  } catch (err) {
    handleError(err, "CREATE SOCIETY ERROR");
  }
};

/* ---------- UPDATE SOCIETY ---------- */
export const updateSociety = async (id, data) => {
  try {
    const res = await api.put(`/societies/${id}`, data);

    handleSuccess("Society updated successfully");

    return res.data;
  } catch (err) {
    handleError(err, "UPDATE SOCIETY ERROR");
  }
};

/* ---------- DELETE SOCIETY ---------- */
export const deleteSociety = async (id) => {
  try {
    const res = await api.delete(`/societies/${id}`);

    handleSuccess("Society deleted successfully");

    return res.data;
  } catch (err) {
    handleError(err, "DELETE SOCIETY ERROR");
  }
};

/* ---------- CREATE TOWERS ---------- */
export const createTowers = async (data) => {
  try {
    const res = await api.post("/societies/towers/bulk", data);

    handleSuccess("Towers created successfully");

    return res.data;
  } catch (err) {
    handleError(err, "CREATE TOWERS ERROR");
  }
};

/* ---------- GENERATE UNITS ---------- */
export const generateUnits = async (data) => {
  try {
    const res = await api.post("/societies/units/generate", data);

    handleSuccess("Units generated successfully");

    return res.data;
  } catch (err) {
    handleError(err, "GENERATE UNITS ERROR");
  }
};


// societyService.js
export const getTowersBySociety = async (societyId) => {
  const res = await api.get(`/societies/${societyId}/towers`);
  return res.data;
};

export const getTowerConfigs = async (societyId) => {
  const res = await api.get(`/societies/${societyId}/configs`);
  return res.data;
};