// ======================================================
// src/hooks/useCategories.ts
// ======================================================

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {appToast} from "../lib/toast";

import {
    createCategory, deleteCategory,
    getCategories, updateCategory
} from "../api/categories.api";

import type {
    CategoryCreate,
    TransactionType,
} from "../types/api";


// ======================================================
// QUERY KEYS
// ======================================================
export const categoryKeys = {

    all: ["categories"] as const,

    list: (
        type?: TransactionType
    ) => [
        ...categoryKeys.all,
        type,
    ] as const,

};


// ======================================================
// GET CATEGORIES
// ======================================================
export function useCategories(
    type?: TransactionType
) {

    return useQuery({

        queryKey:
            categoryKeys.list(type),

        queryFn: () =>
            getCategories(
                type
                    ? { type }
                    : undefined
            ),

    });

}


// ======================================================
// CREATE CATEGORY
// ======================================================
export function useCreateCategory() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: (
            payload: CategoryCreate
        ) =>
            createCategory(payload),

        onSuccess: () => {

            appToast.success(
                "Category created successfully!",
                {description: "Your category has been created."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    categoryKeys.all,
            });

        },

    });

}


// ======================================================
// UPDATE CATEGORY
// ======================================================
export function useUpdateCategory() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: ({
            categoryId,
            payload,
        }: {
            categoryId: number;
            payload: CategoryCreate;
        }) =>
            updateCategory(
                categoryId,
                payload
            ),

        onSuccess: () => {

            appToast.success(
                "Category updated successfully!",
                {description: "Your category has been updated."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    categoryKeys.all,
            });

        },

    });

}


// ======================================================
// DELETE CATEGORY
// ======================================================
export function useDeleteCategory() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: (
            categoryId: number
        ) =>
            deleteCategory(
                categoryId
            ),

        onSuccess: () => {

            appToast.success(
                "Category deleted successfully!",
                {description: "Your category has been deleted."}
            );

            queryClient.invalidateQueries({
                queryKey:
                    categoryKeys.all,
            });

        },

    });

}