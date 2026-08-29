// ======================================================
// src/features/reports/api.ts
// ======================================================


import { api } from "./client";


// ======================================================
// CASH FLOW
// ======================================================
export interface CashFlowResponse {

    start_date: string;

    end_date: string;

    income: number;

    expense: number;

    savings: number;

    savings_rate: number;

}


// ======================================================
// CATEGORY ANALYSIS
// ======================================================
export interface CategoryAnalysisItem {

    category: string;

    amount: number;

    percentage: number;

}

export interface CategoryAnalysisResponse {

    month: number;

    year: number;

    data: CategoryAnalysisItem[];

}


// ======================================================
// INCOME VS EXPENSE TREND
// ======================================================
export interface IncomeExpenseTrendItem {

    month: number;

    income: number;

    expense: number;

}

export interface IncomeExpenseTrendResponse {

    year: number;

    data: IncomeExpenseTrendItem[];

}


// ======================================================
// BUDGET PERFORMANCE
// ======================================================
export interface BudgetPerformanceItem {

    budget_id: number;

    category: string;

    budget: number;

    spent: number;

    variance: number;

    status: string;

}

export interface BudgetPerformanceResponse {

    month: number;

    year: number;

    data: BudgetPerformanceItem[];

}


// ======================================================
// ENDPOINT
// ======================================================
const REPORTS_ENDPOINT =
    "/reports";


// ======================================================
// CASH FLOW REPORT
// ======================================================
export async function getCashFlowReport(
    startDate: string,
    endDate: string
) {

    const response =
        await api.get<CashFlowResponse>(
            `${REPORTS_ENDPOINT}/cash-flow`,
            {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                },
            }
        );

    return response.data;

}


// ======================================================
// CATEGORY ANALYSIS REPORT
// ======================================================
export async function getCategoryAnalysisReport(
    month: number,
    year: number
) {

    const response =
        await api.get<CategoryAnalysisResponse>(
            `${REPORTS_ENDPOINT}/category-analysis`,
            {
                params: {
                    month,
                    year,
                },
            }
        );

    return response.data;

}


// ======================================================
// INCOME VS EXPENSE TREND REPORT
// ======================================================
export async function getIncomeExpenseTrendReport(
    year: number
) {

    const response =
        await api.get<IncomeExpenseTrendResponse>(
            `${REPORTS_ENDPOINT}/income-vs-expense`,
            {
                params: {
                    year,
                },
            }
        );

    return response.data;

}


// ======================================================
// BUDGET PERFORMANCE REPORT
// ======================================================
export async function getBudgetPerformanceReport(
    month: number,
    year: number
) {

    const response =
        await api.get<BudgetPerformanceResponse>(
            `${REPORTS_ENDPOINT}/budget-performance`,
            {
                params: {
                    month,
                    year,
                },
            }
        );

    return response.data;

}