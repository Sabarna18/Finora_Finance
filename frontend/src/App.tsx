import {
  useEffect,
} from "react";

import AppRoutes
  from "./routes/AppRoutes";

import { useAuthStore }
  from "./store/auth.store";


// ======================================================
// APP
// ======================================================
export default function App() {

  const initialize =
    useAuthStore(
      (state) =>
        state.initialize
    );

  const isInitializing =
    useAuthStore(
      (state) =>
        state.isInitializing
    );


  // ======================================================
  // INITIALIZE AUTH
  // ======================================================
  useEffect(() => {

    initialize();

  }, [initialize]);


  // ======================================================
  // LOADING SCREEN
  // ======================================================
  if (isInitializing) {

    return (

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-gray-50
        "
      >

        <p
          className="
            text-sm
            text-gray-500
          "
        >
          Initializing application...
        </p>

      </div>

    );

  }


  // ======================================================
  // ROUTES
  // ======================================================
  return <AppRoutes />;

}