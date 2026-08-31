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
  const response = await api.post<User>(
    "/auth/register",
    payload
  );

  return response.data;
}

// ======================================================
// LOGIN
// POST /auth/login
//
// FastAPI OAuth2PasswordRequestForm expects:
//
// Content-Type:
//   application/x-www-form-urlencoded
//
// username=<email>
// password=<password>
// ======================================================

export async function loginUser(
  payload: LoginRequest
): Promise<AuthResponse> {
  const formData = new URLSearchParams();

  formData.append("username", payload.email);
  formData.append("password", payload.password);

  const response = await api.post<AuthResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

// ======================================================
// CURRENT USER
// GET /auth/me
// ======================================================

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/auth/me");

  return response.data;
}

// ======================================================
// LOGOUT
//
// Frontend-only.
//
// JWT authentication is currently stateless,
// therefore there is no backend logout endpoint.
// ======================================================

export async function logoutUser(): Promise<void> {
  return Promise.resolve();
}

