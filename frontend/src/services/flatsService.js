import api from "./api";
import { toast } from "react-toastify";

/**
 * Generate flats (units with merge support)
 */
export const generateFlats = async (payload) => {
  try {
    const res = await api.post("/flats/generate", payload);

    toast.success(`Generated ${res.data.inserted} units`);
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
 * ✅ ADD THIS FUNCTION
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

export const getAssignedFlatIdsBySociety = async (societyId) => {
  const res = await api.get("/flats/assigned", {
    params: { societyId },
  });
  return res.data;
};

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
