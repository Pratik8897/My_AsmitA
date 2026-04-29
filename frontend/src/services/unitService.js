import api from "./api";
import { toast } from "react-toastify";

export const mergeUnits = async (payload) => {
  try {
    const res = await api.post("/units/merge", payload);
    toast.success("Units merged");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to merge units";
    toast.error(message);
    throw error;
  }
};

export const unmergeUnits = async (payload) => {
  try {
    const res = await api.post("/units/unmerge", payload);
    toast.success("Units unmerged");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Failed to unmerge units";
    toast.error(message);
    throw error;
  }
};

