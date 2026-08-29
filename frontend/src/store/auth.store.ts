import { create } from "zustand";

import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/api";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../api/auth.api";


// ======================================================
// CONSTANTS
// ======================================================
const TOKEN_KEY =
  "access_token";


// ======================================================
// STORE TYPES
// ======================================================
type AuthStore = {

  // ====================================================
  // STATE
  // ====================================================
  token: string | null;

  user: User | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  isInitializing: boolean;


  // ====================================================
  // ACTIONS
  // ====================================================
  login: (
    payload: LoginRequest
  ) => Promise<void>;


  register: (
    payload: RegisterRequest
  ) => Promise<void>;


  logout: () => void;


  initialize: () => Promise<void>;

};


// ======================================================
// STORE
// ======================================================
export const useAuthStore =
  create<AuthStore>(
    (set) => ({

      // ==================================================
      // INITIAL STATE
      // ==================================================
      token:
        localStorage.getItem(
          TOKEN_KEY
        ),

      user: null,

      isAuthenticated: false,

      isLoading: false,

      isInitializing: true,


      // ==================================================
      // LOGIN
      // ==================================================
      login: async (
        payload
      ) => {

        set({
          isLoading: true,
        });

        try {

          // --------------------------------------------
          // LOGIN REQUEST
          // --------------------------------------------
          const response =
            await loginUser(
              payload
            );

          const token =
            response.access_token;


          // --------------------------------------------
          // SAVE TOKEN
          // --------------------------------------------
          localStorage.setItem(
            TOKEN_KEY,
            token
          );


          // --------------------------------------------
          // FETCH USER
          // --------------------------------------------
          const user =
            await getCurrentUser();


          // --------------------------------------------
          // UPDATE STATE
          // --------------------------------------------
          set({

            token,

            user,

            isAuthenticated: true,

            isLoading: false,

          });

        }

        catch (error) {

          set({
            isLoading: false,
          });

          throw error;

        }

      },


      // ==================================================
      // REGISTER
      // ==================================================
      register: async (
        payload
      ) => {

        set({
          isLoading: true,
        });

        try {

          await registerUser(
            payload
          );

          set({
            isLoading: false,
          });

        }

        catch (error) {

          set({
            isLoading: false,
          });

          throw error;

        }

      },


      // ==================================================
      // LOGOUT
      // ==================================================
      logout: () => {

        localStorage.removeItem(
          TOKEN_KEY
        );

        set({

          token: null,

          user: null,

          isAuthenticated: false,

          isLoading: false,

        });

      },


      // ==================================================
      // SESSION RESTORE
      // ==================================================
      initialize:
        async () => {

          const token =
            localStorage.getItem(
              TOKEN_KEY
            );


          // --------------------------------------------
          // NO TOKEN
          // --------------------------------------------
          if (!token) {

            set({

              token: null,

              user: null,

              isAuthenticated: false,

              isInitializing: false,

            });

            return;

          }


          // --------------------------------------------
          // RESTORE SESSION
          // --------------------------------------------
          try {

            const user =
              await getCurrentUser();

            set({

              token,

              user,

              isAuthenticated: true,

              isInitializing: false,

            });

          }

          catch {

            localStorage.removeItem(
              TOKEN_KEY
            );

            set({

              token: null,

              user: null,

              isAuthenticated: false,

              isInitializing: false,

            });

          }

        },

    })
  );