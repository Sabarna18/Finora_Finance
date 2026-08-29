// ======================================================
// src/features/settings/settings.api.ts
// ======================================================

import { api } from "../api/client";


// ======================================================
// TYPES
// ======================================================

// ------------------------------------------------------
// USER PROFILE
// ------------------------------------------------------
export interface UserProfile {

    id: number;

    name: string;

    email: string;

    is_active: boolean;

    created_at: string;

}


// ------------------------------------------------------
// UPDATE PROFILE
// ------------------------------------------------------
export interface UpdateProfilePayload {

    name?: string;

    email?: string;

}


// ------------------------------------------------------
// CHANGE PASSWORD
// ------------------------------------------------------
export interface ChangePasswordPayload {

    current_password: string;

    new_password: string;

}


// ------------------------------------------------------
// DEACTIVATE ACCOUNT
// ------------------------------------------------------
export interface DeactivateAccountResponse {

    message: string;

}


// ======================================================
// ENDPOINT
// ======================================================
const USERS_ENDPOINT =
    "/api/v1/users";


// ======================================================
// GET CURRENT USER PROFILE
// GET /api/v1/users/me
// ======================================================
export async function getProfile() {

    const response =
        await api.get<UserProfile>(
            `${USERS_ENDPOINT}/me`
        );

    return response.data;

}


// ======================================================
// UPDATE PROFILE
// PATCH /api/v1/users/me
// ======================================================
export async function updateProfile(
    payload: UpdateProfilePayload
) {

    const response =
        await api.patch<UserProfile>(
            `${USERS_ENDPOINT}/me`,
            payload
        );

    return response.data;

}


// ======================================================
// CHANGE PASSWORD
// PATCH /api/v1/users/change-password
// ======================================================
export async function changePassword(
    payload: ChangePasswordPayload
) {

    const response =
        await api.patch(
            `${USERS_ENDPOINT}/change-password`,
            payload
        );

    return response.data;

}


// ======================================================
// DEACTIVATE ACCOUNT
// DELETE /api/v1/users/me
// ======================================================
export async function deactivateAccount() {

    const response =
        await api.delete<DeactivateAccountResponse>(
            `${USERS_ENDPOINT}/me`
        );

    return response.data;

}