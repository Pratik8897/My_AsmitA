import api from "./api";

export const getSocietyAdmins = async () => {
  try {
    const res = await api.get("/society-admins");
    return res.data;
  } catch (err) {
    console.error("GET SOCIETY ADMINS ERROR:", err);
    throw err;
  }
};

export const createSocietyAdmin = async (data) => {
  try {
    const res = await api.post("/society-admins", data);
    return res.data;
  } catch (err) {
    console.error("CREATE SOCIETY ADMIN ERROR:", err);
    throw err;
  }
};

export const updateSocietyAdmin = async (id, data) => {
  try {
    const res = await api.put(`/society-admins/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("UPDATE SOCIETY ADMIN ERROR:", err);
    throw err;
  }
};

export const deleteSocietyAdmin = async (id) => {
  try {
    const res = await api.delete(`/society-admins/${id}`);
    return res.data;
  } catch (err) {
    console.error("DELETE SOCIETY ADMIN ERROR:", err);
    throw err;
  }
};
