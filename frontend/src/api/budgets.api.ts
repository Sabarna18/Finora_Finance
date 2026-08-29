// ======================================================
// src/features/budgets/api.ts
// ======================================================

import { api } from "./client";

import type {
    Budget,
    BudgetCreate,
    BudgetUpdate,
    BudgetListParams,
    DeleteBudgetResponse,
    BudgetStatus
} from "../types/api";


// ======================================================
// ENDPOINT
// ======================================================
const BUDGETS_ENDPOINT = "/budgets";

// ======================================================
// QUERY KEYS
// ======================================================
export const budgetKeys = {

    all: ["budgets"] as const,

    status: (
        budgetId: number
    ) => [
        "budget-status",
        budgetId,
    ] as const,

};

// ======================================================
// CREATE BUDGET
// POST /budgets
// ======================================================
export async function createBudget(
    payload: BudgetCreate
): Promise<Budget> {

    const response =
        await api.post<Budget>(
            BUDGETS_ENDPOINT,
            payload
        );

    return response.data;

}


// ======================================================
// GET ALL BUDGETS
// GET /budgets?month=&year=
// ======================================================
export async function getBudgets(
    params?: BudgetListParams
): Promise<Budget[]> {

    const response =
        await api.get<Budget[]>(
            BUDGETS_ENDPOINT,
            {
                params,
            }
        );

    return response.data;

}


// ======================================================
// GET CURRENT MONTH BUDGETS
// GET /budgets/current-month
// ======================================================
export async function getCurrentMonthBudgets(): Promise<
    Budget[]
> {

    const response =
        await api.get<Budget[]>(
            `${BUDGETS_ENDPOINT}/current-month`
        );

    return response.data;

}


// ======================================================
// GET SINGLE BUDGET
// GET /budgets/{id}
// ======================================================
export async function getBudgetById(
    budgetId: number
): Promise<Budget> {

    const response =
        await api.get<Budget>(
            `${BUDGETS_ENDPOINT}/${budgetId}`
        );

    return response.data;

}

// ======================================================
// GET BUDGET STATUS
// GET /budgets/status/{id}
// ======================================================
export async function getBudgetStatus(
    budgetId: number
): Promise<BudgetStatus> {

    const response =
        await api.get<BudgetStatus>(
            `${BUDGETS_ENDPOINT}/status/${budgetId}`
        );

    return response.data;

}


// ======================================================
// UPDATE BUDGET
// PUT /budgets/{id}
// ======================================================
export async function updateBudget(
    budgetId: number,
    payload: BudgetUpdate
): Promise<Budget> {

    const response =
        await api.put<Budget>(
            `${BUDGETS_ENDPOINT}/${budgetId}`,
            payload
        );

    return response.data;

}


// ======================================================
// DELETE BUDGET
// DELETE /budgets/{id}
// ======================================================
export async function deleteBudget(
    budgetId: number
): Promise<DeleteBudgetResponse> {

    const response =
        await api.delete<DeleteBudgetResponse>(
            `${BUDGETS_ENDPOINT}/${budgetId}`
        );

    return response.data;

}