import { useMutation } from "@tanstack/react-query";

import {
  useNavigate,
} from "react-router-dom";

import type {
  RegisterRequest,
} from "../types/api";

import {
  useAuthStore,
} from "../store/auth.store";

import {
  appToast,
} from "../lib/toast";


export function useRegister() {

  const register =
    useAuthStore(
      (state) =>
        state.register
    );


  const navigate =
    useNavigate();


  return useMutation({

    // ==========================================
    // REGISTER
    // ==========================================
    mutationFn: async (
      payload: RegisterRequest
    ) => {

      await register(
        payload
      );

    },


    // ==========================================
    // SUCCESS
    // ==========================================
    onSuccess: () => {

      appToast.success(
        "Registration successful! Please log in.",
        {description: "You can now log in with your new account."}
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    },

  });

}