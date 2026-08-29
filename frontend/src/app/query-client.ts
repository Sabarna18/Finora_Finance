import {
  QueryClient,
} from "@tanstack/react-query";


export const queryClient =
  new QueryClient({

    defaultOptions: {

      queries: {

        retry: 1,

        refetchOnWindowFocus:
          false,

      },


      mutations: {

        retry: 0,

      },

    },

  });


// ======================================================
// src/constants/query-keys.ts
// ======================================================

export const queryKeys = {

  reports: {

    all: [
      "reports",
    ] as const,

    cashFlow: (
      startDate: string,
      endDate: string
    ) =>
      [
        "reports",
        "cash-flow",
        startDate,
        endDate,
      ] as const,

    categoryAnalysis: (
      month: number,
      year: number
    ) =>
      [
        "reports",
        "category-analysis",
        month,
        year,
      ] as const,

    incomeExpenseTrend: (
      year: number
    ) =>
      [
        "reports",
        "income-expense-trend",
        year,
      ] as const,

    budgetPerformance: (
      month: number,
      year: number
    ) =>
      [
        "reports",
        "budget-performance",
        month,
        year,
      ] as const,

  },

};