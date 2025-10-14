// src/services/api.js
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx"; // For logout trigger

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: Add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Trigger logout (in component, or window.location.href = '/login')
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
