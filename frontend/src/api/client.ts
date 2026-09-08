import axios from "axios";

// ==========================================
// AXIOS INSTANCE
// ==========================================

export const api = axios.create({
  // Backend origin + centralized API version prefix
  //
  // Local:
  //   http://localhost:8000/api/v1
  //
  // Production:
  //   https://your-render-backend.onrender.com/api/v1
  //
  // Individual API modules should NOT repeat /api/v1.
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================
// Inject JWT token automatically
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
// Handle expired/invalid token
// ==========================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

