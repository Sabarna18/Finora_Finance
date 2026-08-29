// ======================================================
// src/hooks/useReports.ts
// ======================================================

import { useQuery } from "@tanstack/react-query";

import {
    getCashFlowReport,
    getCategoryAnalysisReport,
    getIncomeExpenseTrendReport,
    getBudgetPerformanceReport,
} from "../api/reports.api";

import { queryKeys } from "../app/query-client";


// ======================================================
// CASH FLOW REPORT
// ======================================================
export function useCashFlowReport(
    startDate: string,
    endDate: string
) {
    return useQuery({
        queryKey:
            queryKeys.reports.cashFlow(
                startDate,
                endDate
            ),

        queryFn: () =>
            getCashFlowReport(
                startDate,
                endDate
            ),

        enabled:
            Boolean(startDate) &&
            Boolean(endDate),
    });
}


// ======================================================
// CATEGORY ANALYSIS REPORT
// ======================================================
export function useCategoryAnalysisReport(
    month: number,
    year: number
) {
    return useQuery({
        queryKey:
            queryKeys.reports.categoryAnalysis(
                month,
                year
            ),

        queryFn: () =>
            getCategoryAnalysisReport(
                month,
                year
            ),

        enabled:
            Boolean(month) &&
            Boolean(year),
    });
}


// ======================================================
// INCOME VS EXPENSE TREND REPORT
// ======================================================
export function useIncomeExpenseTrendReport(
    year: number
) {
    return useQuery({
        queryKey:
            queryKeys.reports.incomeExpenseTrend(
                year
            ),

        queryFn: () =>
            getIncomeExpenseTrendReport(
                year
            ),

        enabled:
            Boolean(year),
    });
}


// ======================================================
// BUDGET PERFORMANCE REPORT
// ======================================================
export function useBudgetPerformanceReport(
    month: number,
    year: number
) {
    return useQuery({
        queryKey:
            queryKeys.reports.budgetPerformance(
                month,
                year
            ),

        queryFn: () =>
            getBudgetPerformanceReport(
                month,
                year
            ),

        enabled:
            Boolean(month) &&
            Boolean(year),
    });
}