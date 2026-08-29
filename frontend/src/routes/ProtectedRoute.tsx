import type {
  ReactNode,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuthStore } from "../store/auth.store";


// ======================================================
// TYPES
// ======================================================
interface ProtectedRouteProps {
  children: ReactNode;
}


// ======================================================
// COMPONENT
// ======================================================
export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {

  const isAuthenticated =
    useAuthStore(
      (state) =>
        state.isAuthenticated
    );

  const isLoading =
    useAuthStore(
      (state) =>
        state.isLoading
    );

  const location =
    useLocation();


  // ==========================================
  // Session restore still running
  // Prevent redirect flicker
  // ==========================================
  if (isLoading) {

    return (

      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
      >
        Loading...
      </div>
    );
  }


  // ==========================================
  // Not authenticated
  // Redirect to login
  // ==========================================
  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"

        replace

        state={{
          from: location,
        }}
      />
    );
  }


  // ==========================================
  // Authenticated
  // Render protected content
  // ==========================================
  return (
    <>
      {children}
    </>
  );
}