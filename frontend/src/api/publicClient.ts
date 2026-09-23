// ==========================================================
// src/api/publicClient.ts
// ==========================================================
//
// Finora Public API Client
//
// Purpose:
//   Axios client for endpoints that do NOT require
//   authentication.
//
// Used by:
//   - Health checks
//   - Public application metadata
//   - Public API endpoints
//
// Important:
//   - No JWT injection
//   - No 401 redirect
//   - Uses the same VITE_API_URL as the main API client
//
// Environment:
//
//   VITE_API_URL=http://localhost:8000
//
// API base URL:
//
//   http://localhost:8000/api/v1
//
// ==========================================================

import axios from "axios";

// ==========================================================
// API BASE URL
// ==========================================================
//
// VITE_API_URL contains only the backend origin.
//
// Example:
//
//   http://localhost:8000
//
// Production:
//
//   https://finora-backend-latest.onrender.com
//
// /api/v1 is added centrally here.
//
// ==========================================================

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is not configured. Please define VITE_API_URL in the frontend environment."
  );
}

// ==========================================================
// Public Axios Instance
// ==========================================================

export const publicApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,

  headers: {
    "Content-Type": "application/json",
  },
});

