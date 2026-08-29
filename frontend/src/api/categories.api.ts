// ======================================================
// src/features/categories/api.ts
// ======================================================

import { api } from "./client";

import type {
    Category,
    CategoryCreate,
    TransactionType,
} from "../types/api";


// ======================================================
// QUERY PARAMS
// ======================================================
export interface GetCategoriesParams {

    type?: TransactionType;

}


// ======================================================
// RESPONSE TYPES
// ======================================================
export interface DeleteCategoryResponse {

    message: string;

}


// ======================================================
// API ENDPOINT
// ======================================================
const CATEGORIES_ENDPOINT =
    "/categories";


// ======================================================
// CREATE CATEGORY
// POST /categories
// ======================================================
export async function createCategory(
    payload: CategoryCreate
) {

    const response =
        await api.post<Category>(
            CATEGORIES_ENDPOINT,
            payload
        );

    return response.data;

}


// ======================================================
// GET ALL CATEGORIES
// GET /categories?type=income
// ======================================================
export async function getCategories(
    params?: GetCategoriesParams
) {

    const response =
        await api.get<Category[]>(
            CATEGORIES_ENDPOINT,
            {
                params,
            }
        );

    return response.data;

}


// ======================================================
// GET SINGLE CATEGORY
// GET /categories/:id
// ======================================================
export async function getCategoryById(
    categoryId: number
) {

    const response =
        await api.get<Category>(
            `${CATEGORIES_ENDPOINT}/${categoryId}`
        );

    return response.data;

}


// ======================================================
// UPDATE CATEGORY
// PUT /categories/:id
// ======================================================
export async function updateCategory(
    categoryId: number,
    payload: CategoryCreate
) {

    const response =
        await api.put<Category>(
            `${CATEGORIES_ENDPOINT}/${categoryId}`,
            payload
        );

    return response.data;

}


// ======================================================
// DELETE CATEGORY
// DELETE /categories/:id
// ======================================================
export async function deleteCategory(
    categoryId: number
) {

    const response =
        await api.delete<DeleteCategoryResponse>(
            `${CATEGORIES_ENDPOINT}/${categoryId}`
        );

    return response.data;

}