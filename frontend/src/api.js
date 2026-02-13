import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("admin_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("admin_token");
  }
}

const existing = localStorage.getItem("admin_token");
if (existing) {
  setAuthToken(existing);
}

