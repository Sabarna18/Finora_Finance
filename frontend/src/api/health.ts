// ==========================================================
// src/api/health.ts
// ==========================================================
//
// Finora Backend Health API
//
// Purpose:
//   Resolve the actual running backend application metadata.
//
// Version source of truth:
//
//   Git Release Tag
//        ↓
//   APP_VERSION
//        ↓
//   Backend Docker Image
//        ↓
//   /api/v1/health
//        ↓
//   Frontend
//
// The frontend does NOT use VITE_APP_VERSION as the
// runtime application version.
//
// ==========================================================

import { publicApi } from "./publicClient";

// ==========================================================
// Health Status
// ==========================================================

export type HealthStatus = "healthy" | "unhealthy";

// ==========================================================
// Health Response
// ==========================================================

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  app_name: string;
  version: string;
}

// ==========================================================
// Get Backend Health
// ==========================================================
//
// Endpoint:
//
//   GET /api/v1/health
//
// Because publicApi already uses:
//
//   /api/v1
//
// this function only needs:
//
//   /health
//
// ==========================================================

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await publicApi.get<HealthResponse>("/health");

  return response.data;
};

