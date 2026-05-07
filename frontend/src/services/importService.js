import api from "./api";
import { toast } from "react-toastify";

export const importUnitsFile = async (file, meta = {}, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (meta?.societyId) formData.append("society_id", String(meta.societyId));
    if (meta?.towerId) formData.append("tower_id", String(meta.towerId));

    const res = await api.post("/import-units", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    toast.success("Import completed successfully");
    return res.data;

  } catch (error) {
    console.error(error);

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Import failed";

    toast.error(message);

    throw error;
  }
};
