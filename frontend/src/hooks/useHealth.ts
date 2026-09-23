// ==========================================================
// src/hooks/useHealth.ts
// ==========================================================
//
// Finora Backend Health Hook
//
// Resolves:
//   - Application name
//   - Backend version
//   - API health status
//
// Source of truth:
//   Backend /api/v1/health
//
// ==========================================================

import { useQuery } from "@tanstack/react-query";

import { getHealth } from "../api/health";

// ==========================================================
// Query Key
// ==========================================================

export const HEALTH_QUERY_KEY = ["health"] as const;

// ==========================================================
// Hook
// ==========================================================

export const useHealth = () => {
  return useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: getHealth,

    // Health metadata does not need to be requested
    // on every component render.
    staleTime: 60_000,

    // Retry temporary network failures.
    retry: 2,

    // Check again when the user returns to the tab.
    refetchOnWindowFocus: true,
  });
};

