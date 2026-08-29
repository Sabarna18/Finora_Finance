// ======================================================
// src/features/transactions/api.ts
// ======================================================

import { api } from "./client";


// ======================================================
// ENUMS
// ======================================================
export enum TransactionType {

    INCOME = "income",

    EXPENSE = "expense",

}


// ======================================================
// TYPES
// ======================================================

// ------------------------------------------------------
// BASE
// ------------------------------------------------------
export interface TransactionBase {

    amount: number;

    type: TransactionType;

    description?: string | null;

    /**
     * YYYY-MM-DD
     */
    date: string;

    category_id?: number | null;

}


// ------------------------------------------------------
// CREATE
// ------------------------------------------------------
export interface TransactionCreate
    extends TransactionBase { }


// ------------------------------------------------------
// UPDATE
// ------------------------------------------------------
export interface TransactionUpdate {

    amount?: number;

    type?: TransactionType;

    description?: string | null;

    /**
     * YYYY-MM-DD
     */
    date?: string;

    category_id?: number | null;

}


// ------------------------------------------------------
// RESPONSE
// ------------------------------------------------------
export interface TransactionResponse
    extends TransactionBase {

    id: number;

    user_id: number;

    /**
     * UTC timestamp
     */
    created_at: string;

}


// ------------------------------------------------------
// LIST QUERY PARAMS
// ------------------------------------------------------
export interface TransactionListParams {

    page?: number;

    limit?: number;

    search?: string;

    month?: number;

    year?: number;
    
    week?: number;

    type?: TransactionType;

    category_id?: number;

    /**
     * YYYY-MM-DD
     */
    start_date?: string;

    /**
     * YYYY-MM-DD
     */
    end_date?: string;

    sort?:
    | "date"
    | "-date"
    | "amount"
    | "-amount";

}


// ------------------------------------------------------
// DELETE RESPONSE
// ------------------------------------------------------
export interface DeleteTransactionResponse {

    message: string;

}


// ======================================================
// ENDPOINT
// ======================================================
const TRANSACTIONS_ENDPOINT =
    "/transactions";


// ======================================================
// CREATE
// ======================================================
export async function createTransaction(
    payload: TransactionCreate
): Promise<TransactionResponse> {

    const response =
        await api.post<TransactionResponse>(
            TRANSACTIONS_ENDPOINT,
            payload
        );

    return response.data;

}


// ======================================================
// LIST
// ======================================================
export async function getTransactions(
    params?: TransactionListParams
): Promise<TransactionResponse[]> {

    const response =
        await api.get<TransactionResponse[]>(
            TRANSACTIONS_ENDPOINT,
            {
                params,
            }
        );

    return response.data;

}


// ======================================================
// GET SINGLE
// ======================================================
export async function getTransactionById(
    transactionId: number
): Promise<TransactionResponse> {

    const response =
        await api.get<TransactionResponse>(
            `${TRANSACTIONS_ENDPOINT}/${transactionId}`
        );

    return response.data;

}


// ======================================================
// UPDATE
// ======================================================
export async function updateTransaction(
    transactionId: number,
    payload: TransactionUpdate
): Promise<TransactionResponse> {

    const response =
        await api.patch<TransactionResponse>(
            `${TRANSACTIONS_ENDPOINT}/${transactionId}`,
            payload
        );

    return response.data;

}


// ======================================================
// DELETE
// ======================================================
export async function deleteTransaction(
    transactionId: number
): Promise<DeleteTransactionResponse> {

    const response =
        await api.delete<DeleteTransactionResponse>(
            `${TRANSACTIONS_ENDPOINT}/${transactionId}`
        );

    return response.data;

}