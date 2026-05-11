import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("myasmita:auth-user");
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (user) {
    config.headers = config.headers || {};
    if (user.user_id != null) config.headers["X-User-Id"] = String(user.user_id);
    if (user.user_type) config.headers["X-User-Type"] = String(user.user_type);
  }

  return config;
});

export default API;
