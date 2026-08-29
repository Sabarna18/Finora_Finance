// ======================================================
// src/features/transactions/hooks/useTransactions.ts
// ======================================================

import {
    useMutation,
    useQuery,
} from "@tanstack/react-query";

import {

    createTransaction,

    deleteTransaction,

    getTransactionById,

    getTransactions,

    updateTransaction,

    TransactionCreate,

    TransactionListParams,

    TransactionUpdate,

} from "../api/transactions.api";

import { appToast } from "../lib/toast";


// ======================================================
// QUERY KEYS
// ======================================================
export const transactionKeys = {

    all: ["transactions"] as const,

    lists: () =>
        [...transactionKeys.all, "list"] as const,

    list: (
        params?: TransactionListParams
    ) =>
        [
            ...transactionKeys.lists(),
            params,
        ] as const,

    details: () =>
        [...transactionKeys.all, "detail"] as const,

    detail: (
        id: number
    ) =>
        [
            ...transactionKeys.details(),
            id,
        ] as const,

};


// ======================================================
// LIST TRANSACTIONS
// ======================================================
export function useTransactions(
    params?: TransactionListParams
) {

    const query =
        useQuery({

            queryKey:
                transactionKeys.list(
                    params
                ),

            queryFn: () =>
                getTransactions(
                    params
                ),

        });

    return {

        transactions:
            query.data ?? [],

        loading:
            query.isLoading,

        error:
            query.isError,

        refetch:
            query.refetch,

    };

}


// ======================================================
// GET SINGLE TRANSACTION
// ======================================================
export function useTransaction(
    transactionId: number
) {

    return useQuery({

        queryKey:
            transactionKeys.detail(
                transactionId
            ),

        queryFn: () =>
            getTransactionById(
                transactionId
            ),

        enabled:
            !!transactionId,

    });

}


// ======================================================
// CREATE TRANSACTION
// ======================================================
export function useCreateTransaction() {

    return useMutation({

        mutationFn: (
            payload:
                TransactionCreate
        ) =>
            createTransaction(
                payload
            ),

            onSuccess: () => {

                appToast.success(
                    "Transaction created successfully!",
                    {description: "Your transaction has been created."}
                );

            },

    });

}


// ======================================================
// UPDATE TRANSACTION
// ======================================================
export function useUpdateTransaction() {

    return useMutation({

        mutationFn: ({
            transactionId,

            payload,

        }: {

            transactionId:
            number;

            payload:
            TransactionUpdate;

        }) =>

            updateTransaction(

                transactionId,

                payload

            ),

            onSuccess: () => {

                appToast.success(
                    "Transaction updated successfully!",
                    {description: "Your transaction has been updated."}
                );

            },

    });

}


// ======================================================
// DELETE TRANSACTION
// ======================================================
export function useDeleteTransaction() {

    return useMutation({

        mutationFn: (
            transactionId:
                number
        ) =>

            deleteTransaction(
                transactionId
            ),

            onSuccess: () => {

                appToast.success(
                    "Transaction deleted successfully!",
                    {description: "Your transaction has been deleted."}
                );

            },

    });

}