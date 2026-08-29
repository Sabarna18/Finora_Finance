// ======================================================
// src/hooks/useBudgets.ts
// ======================================================

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {appToast} from "../lib/toast";

import {

    createBudget,

    deleteBudget,

    getBudgetById,

    getBudgets,

    getCurrentMonthBudgets,

    updateBudget,

} from "../api/budgets.api";

import type {

    BudgetCreate,

    BudgetListParams,

    BudgetUpdate,

} from "../types/api";


// ======================================================
// QUERY KEYS
// ======================================================
export const budgetKeys = {

    all: ["budgets"] as const,

    lists: () =>
        [...budgetKeys.all, "list"] as const,

    list: (
        params?: BudgetListParams
    ) =>
        [
            ...budgetKeys.lists(),
            params,
        ] as const,

    currentMonth: () =>
        [
            ...budgetKeys.all,
            "current-month",
        ] as const,

    detail: (
        budgetId: number
    ) =>
        [
            ...budgetKeys.all,
            budgetId,
        ] as const,

};


// ======================================================
// GET ALL
// ======================================================
export function useBudgets(
    params?: BudgetListParams
) {

    return useQuery({

        queryKey:
            budgetKeys.list(
                params
            ),

        queryFn: () =>
            getBudgets(
                params
            ),

    });

}


// ======================================================
// CURRENT MONTH
// ======================================================
export function useCurrentMonthBudgets() {

    return useQuery({

        queryKey:
            budgetKeys.currentMonth(),

        queryFn:
            getCurrentMonthBudgets,

    });

}


// ======================================================
// SINGLE
// ======================================================
export function useBudget(
    budgetId?: number
) {

    return useQuery({

        enabled:
            !!budgetId,

        queryKey:
            budgetKeys.detail(
                budgetId as number
            ),

        queryFn: () =>
            getBudgetById(
                budgetId as number
            ),

    });

}


// ======================================================
// CREATE
// ======================================================
export function useCreateBudget() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: (
            payload: BudgetCreate
        ) =>
            createBudget(
                payload
            ),

        onSuccess: () => {

            appToast.success(
                "Budget created successfully!",
                {description: "Your budget has been created."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    budgetKeys.all,
            });

        },

    });

}


// ======================================================
// UPDATE
// ======================================================
export function useUpdateBudget() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: ({
            budgetId,
            payload,
        }: {

            budgetId: number;

            payload: BudgetUpdate;

        }) =>
            updateBudget(
                budgetId,
                payload
            ),

        onSuccess: () => {

            appToast.success(
                "Budget updated successfully!",
                {description: "Your budget has been updated."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    budgetKeys.all,
            });

        },

    });

}


// ======================================================
// DELETE
// ======================================================
export function useDeleteBudget() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: (
            budgetId: number
        ) =>
            deleteBudget(
                budgetId
            ),

        onSuccess: () => {

            appToast.success(
                "Budget deleted successfully!",
                {description: "Your budget has been deleted."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    budgetKeys.all,
            });

        },

    });

}