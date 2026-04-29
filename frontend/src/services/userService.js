import api from "./api";

export const getUsers = async (societyId = null) => {
  try {
    const res = await api.get("/users", {
      params: societyId ? { societyId } : undefined,
    });
    return res.data;
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    throw err;
  }
};

export const getUserFlatMappings = async (userId) => {
  const res = await api.get(`/users/${userId}/flats`);
  return res.data;
};

export const createUser = async (data) => {
  try {
    const res = await api.post("/users", data);
    return res.data;
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    throw err;
  }
};

export const updateUser = async (id, data) => {
  try {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    throw err;
  }
};

export const getUserStats = async () => {
  const res = await api.get("/users/stats");
  return res.data;
};
