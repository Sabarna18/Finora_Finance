import { useMutation } from "@tanstack/react-query";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import type {
  LoginRequest,
} from "../types/api";

import {
  useAuthStore,
} from "../store/auth.store";

import {
  appToast,
} from "../lib/toast";

import {
  getApiErrorMessage,
} from "../utils/getApiErrorMessage";


export function useLogin() {

  const login =
    useAuthStore(
      (state) => state.login
    );


  const navigate =
    useNavigate();


  const location =
    useLocation();


  const from =
    (
      location.state as {
        from?: {
          pathname?: string;
        };
      }
    )?.from?.pathname
    || "/dashboard";


  return useMutation({

    // ==========================================
    // LOGIN MUTATION
    // ==========================================
    mutationFn: async (
      payload: LoginRequest
    ) => {

      await login(
        payload
      );

    },


    // ==========================================
    // SUCCESS
    // ==========================================
    onSuccess: () => {

      appToast.success(
        "Welcome back",
        {
          description:
            "You've successfully signed in to Finora.",
        }
      );


      navigate(
        from,
        {
          replace: true,
        }
      );

    },

    onError: (error) => {

      appToast.error(
        "Sign in failed",
        {
          description:
            getApiErrorMessage(
              error,
              "Check your email and password and try again."
            ),
        }
      );

    },
  });

}