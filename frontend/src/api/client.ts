import axios from "axios";


// ==========================================
// AXIOS INSTANCE
// ==========================================
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  timeout: 10000,

  headers: {
    "Content-Type": "application/json",
  },
});


// ==========================================
// REQUEST INTERCEPTOR
// Inject JWT token automatically
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "access_token"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ==========================================
// RESPONSE INTERCEPTOR
// Handle expired/invalid token
// ==========================================
api.interceptors.response.use(
  (response) => response,

  (error) => {

    if (
      error.response?.status === 401
    ) {

      localStorage.removeItem(
        "access_token"
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);