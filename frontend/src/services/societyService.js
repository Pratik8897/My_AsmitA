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
  throw new Error(message);
};

/* ---------- SUCCESS HANDLER ---------- */
const handleSuccess = (message) => {
  toast.success(message);
};

/* =====================================================
   SOCIETY
===================================================== */

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

export const createSociety = async (data) => {
  try {
    const res = await api.post("/societies", data);
    handleSuccess("Society created successfully");
    return res.data;
  } catch (err) {
    handleError(err, "CREATE SOCIETY ERROR");
  }
};

export const updateSociety = async (id, data) => {
  try {
    const res = await api.put(`/societies/${id}`, data);
    handleSuccess("Society updated successfully");
    return res.data;
  } catch (err) {
    handleError(err, "UPDATE SOCIETY ERROR");
  }
};

export const deleteSociety = async (id) => {
  try {
    const res = await api.delete(`/societies/${id}`);
    handleSuccess("Society deleted successfully");
    return res.data;
  } catch (err) {
    handleError(err, "DELETE SOCIETY ERROR");
  }
};

/* =====================================================
   TOWERS
===================================================== */

export const getTowersBySociety = async (societyId) => {
  try {
    const res = await api.get(`/societies/${societyId}/towers`);
    return res.data;
  } catch (err) {
    handleError(err, "GET TOWERS ERROR");
  }
};

export const createTowers = async (data) => {
  try {
    const res = await api.post("/societies/towers/bulk", data);
    handleSuccess("Towers saved successfully");
    return res.data;
  } catch (err) {
    handleError(err, "CREATE TOWERS ERROR");
  }
};

/* =====================================================
   UNITS / CONFIG
===================================================== */

/**
 * 🔥 This now returns:
 * [
 *   {
 *     tower_id,
 *     tower_name,
 *     total_floors,
 *     units_per_floor,
 *     units: ["101","102","103"...]  <-- NEW
 *   }
 * ]
 */
export const getTowerConfigs = async (societyId) => {
  try {
    const res = await api.get(`/societies/${societyId}/configs`);
    return res.data;
  } catch (err) {
    handleError(err, "GET CONFIG ERROR");
  }
};

/**
 * Generate units (floors + flats)
 */
export const generateUnits = async (data) => {
  try {
    const res = await api.post("/societies/units/generate", data);
    handleSuccess("Units generated successfully");
    return res.data;
  } catch (err) {
    handleError(err, "GENERATE UNITS ERROR");
  }
};

/* =====================================================
   OPTIONAL (DIRECT UNIT FETCH - FUTURE)
===================================================== */

export const getUnitsByTower = async (towerId) => {
  try {
    const res = await api.get(`/societies/towers/${towerId}/units`);
    return res.data;
  } catch (err) {
    handleError(err, "GET UNITS ERROR");
  }
};

export const deleteTower = async (towerId) => {
  try {
    const res = await api.delete(`/societies/towers/${towerId}`);
    handleSuccess("Tower deleted successfully");
    return res.data;
  } catch (err) {
    handleError(err, "DELETE TOWER ERROR");
  }
};
