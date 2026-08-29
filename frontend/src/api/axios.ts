import axios from "axios";


// ======================================================
// AXIOS INSTANCE
// ======================================================
export const api = axios.create({

  baseURL:
    "http://localhost:8000",

});


// ======================================================
// REQUEST INTERCEPTOR
// ======================================================
api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
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