import api from "./api";

export const getSocieties = async () => {
  try {
    const res = await api.get("/societies");
    return res.data;
  } catch (err) {
    console.error("GET SOCIETIES ERROR:", err);
    throw err;
  }
};

export const createSociety = async (data) => {
  try {
    const res = await api.post("/societies", data);
    return res.data;
  } catch (err) {
    console.error("CREATE SOCIETY ERROR:", err);
    throw err;
  }
};

export const updateSociety = async (id, data) => {
  try {
    const res = await api.put(`/societies/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("UPDATE SOCIETY ERROR:", err);
    throw err;
  }
};

export const deleteSociety = async (id) => {
  try {
    const res = await api.delete(`/societies/${id}`);
    return res.data;
  } catch (err) {
    console.error("DELETE SOCIETY ERROR:", err);
    throw err;
  }
};
