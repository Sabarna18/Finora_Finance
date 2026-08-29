// ======================================================
// src/api/auth.ts
// ======================================================

import { api } from "./client";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/api";


// ======================================================
// REGISTER
// POST /auth/register
// ======================================================
export async function registerUser(
  payload: RegisterRequest
): Promise<User> {

  try {

    const response =
      await api.post<User>(
        "/auth/register",
        payload
      );

    return response.data;

  } catch (error) {

    // Preserve the original Axios error so
    // getApiErrorMessage() can inspect:
    //
    // error.response.status
    // error.response.data.detail
    //
    // TanStack Query will receive this error
    // and trigger mutation.onError().

    throw error;

  }

}


// ======================================================
// LOGIN
// POST /auth/login
//
// FastAPI OAuth2PasswordRequestForm expects:
//
// Content-Type:
// application/x-www-form-urlencoded
//
// username=<email>
// password=<password>
// ======================================================

export async function loginUser(
  payload: LoginRequest
): Promise<AuthResponse> {

  try {

    const formData =
      new URLSearchParams();

    formData.append(
      "username",
      payload.email
    );

    formData.append(
      "password",
      payload.password
    );


    const response =
      await api.post<AuthResponse>(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

    return response.data;

  } catch (error) {

    // IMPORTANT:
    // Never convert this into a generic Error here.
    //
    // We want the original AxiosError to reach:
    //
    // useMutation()
    //      ↓
    // onError(error)
    //      ↓
    // getApiErrorMessage(error)
    //      ↓
    // appToast.error(...)

    throw error;

  }

}


// ======================================================
// CURRENT USER
// GET /auth/me
// ======================================================
export async function getCurrentUser():
  Promise<User> {

  try {

    const response =
      await api.get<User>(
        "/auth/me"
      );

    return response.data;

  } catch (error) {

    /*
     * Important during session restoration.
     *
     * 401 / 403 responses must remain Axios errors
     * so the auth store/interceptor can distinguish
     * authentication failures correctly.
     */

    throw error;

  }

}


// ======================================================
// LOGOUT
//
// Frontend-only.
//
// JWT authentication is currently stateless,
// therefore there is no backend logout endpoint.
// ======================================================
export async function logoutUser():
  Promise<void> {

  return Promise.resolve();


}