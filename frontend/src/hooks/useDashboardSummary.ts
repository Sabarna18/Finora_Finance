import {
  useQuery,
} from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";


// ======================================================
// TYPES
// ======================================================
interface DashboardSummaryParams {

  month?: number;

  year?: number;

}


// ======================================================
// HOOK
// ======================================================
export function useDashboardSummary(
  params?: DashboardSummaryParams
) {

  return useQuery({

    queryKey: [
      "dashboard-summary",
      params,
    ],

    queryFn: () =>
      dashboardApi.getSummary(
        params
      ),

  });

}