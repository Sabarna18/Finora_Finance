// ======================================================
// src/hooks/useBudgetStatuses.ts
// ======================================================

import {
    useQuery,
} from "@tanstack/react-query";

import {
    dashboardApi,
} from "../api/dashboard.api";


// ======================================================
// QUERY KEYS
// ======================================================
export const budgetStatusKeys = {

    all: ["budget-statuses"] as const,

    list: (
        month: number,
        year: number
    ) => [

        ...budgetStatusKeys.all,

        month,

        year,

    ] as const,

};


// ======================================================
// GET ALL BUDGET STATUSES
// Uses Dashboard Bulk Endpoint
// GET /dashboard/status
// ======================================================
export function useBudgetStatuses(
    month: number,
    year: number
) {

    return useQuery({

        queryKey:
            budgetStatusKeys.list(
                month,
                year
            ),

        queryFn: () =>
            dashboardApi.getBudgetStatuses({

                month,

                year,

            }),

        enabled:
            !!month &&
            !!year,

        staleTime:
            1000 * 60,

    });

}