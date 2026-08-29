import {
  useQuery,
} from "@tanstack/react-query";

import { dashboardApi } from "../api/dashboard.api";


// ======================================================
// HOOK
// ======================================================
export function useRecentTransactions(
  limit = 5
) {

  return useQuery({

    queryKey: [
      "recent-transactions",
      limit,
    ],

    queryFn: () =>
      dashboardApi.getRecentTransactions(
        limit
      ),

  });

}