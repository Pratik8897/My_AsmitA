import axios from "axios";

// 🔥 Create reusable axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ GET USERS
export const getUsers = async () => {
  try {
    const res = await api.get("/users");
    return res.data;
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    throw err;
  }
};

// ✅ CREATE USER
export const createUser = async (data) => {
  try {
    const res = await api.post("/users", data);
    return res.data;
  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    throw err;
  }
};

// ✅ DELETE (SOFT DELETE)
export const deleteUser = async (id) => {
  try {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    throw err;
  }
};

// ✅ UPDATE USER
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