import api from "./api";
import { toast } from "react-toastify";

/**
 * Generate flats (first time only)
 */
export const generateFlats = async (payload) => {
  try {
    const res = await api.post("/flats/generate", payload);

    toast.success(`Generated ${res.data.inserted || "units"}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to generate flats";

    toast.error(message);
    throw error;
  }
};

/**
 * Get flats by society
 */
export const getFlatsBySociety = async (societyId) => {
  try {
    const res = await api.get(`/flats/society/${societyId}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      "Failed to fetch flats";

    toast.error(message);
    throw error;
  }
};

/**
 * Get assigned flats
 */
export const getAssignedFlatIdsBySociety = async (societyId) => {
  const res = await api.get("/flats/assigned", {
    params: { societyId },
  });
  return res.data;
};

/**
 * Get flat details
 */
export const getFlatById = async (flatId) => {
  try {
    const res = await api.get(`/flats/${flatId}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch flat details";

    toast.error(message);
    throw error;
  }
};

/**
 * Update unit types only
 */
export const bulkUpdateFlatUnitTypes = async (updates = []) => {
  if (!updates.length) return;

  try {
    const res = await api.put("/flats/unit-types/bulk", { updates });

    toast.success("Unit types updated");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to update unit types";

    toast.error(message);
    throw error;
  }
};

/**
 * 🔥 NEW: Update structure (ADD / REMOVE units)
 */
export const updateFlatStructure = async (updates = []) => {
  const payload = updates;
  if (!payload || (Array.isArray(payload) && payload.length === 0)) return;

  try {
    const res = await api.post("/flats/update-structure", payload);

    toast.success("Units updated successfully");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to update units";

    toast.error(message);
    throw error;
  }
};