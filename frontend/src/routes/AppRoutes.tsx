import {
  BrowserRouter,
  Routes,
  Route,

} from "react-router-dom";

import ProtectedRoute
  from "./ProtectedRoute";

import AppLayout from "../components/layout/AppLayout";

import AppToaster from "../components/ui/AppToaster";

// ======================================================
// PAGES
// ======================================================
import LandingPage from "../pages/LandingPage";

import AboutPage from "../pages/AboutPage";

import LoginPage
  from "../pages/LoginPage";

import RegisterPage
  from "../pages/RegisterPage";

import DashboardPage
  from "../pages/DashboardPage";

import TransactionsPage
  from "../pages/TransactionsPage";

import CategoriesPage
  from "../pages/CategoriesPage";

import BudgetsPage
  from "../pages/BudgetsPage";

import ReportsPage
  from "../pages/ReportsPage";

import SettingsPage
  from "../pages/SettingsPage";


// ======================================================
// 404 PAGE
// ======================================================
function NotFoundPage() {

  return (

    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
      "
    >

      <h1
        className="
          text-2xl
          font-bold
        "
      >
        404 Page Not Found
      </h1>

    </div>

  );

}


// ======================================================
// ROUTES
// ======================================================
export default function AppRoutes() {



  return (

    <BrowserRouter>

      <Routes>

        {/* ==================================================
            ROOT REDIRECT
        ================================================== */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/about"
          element={<AboutPage />}
        />


        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />


        {/* ==================================================
            PROTECTED APP ROUTES
        ================================================== */}
        <Route
          element={
            <ProtectedRoute>

              <AppLayout />

            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/transactions"
            element={<TransactionsPage />}
          />

          <Route
            path="/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="/budgets"
            element={<BudgetsPage />}
          />

          <Route
            path="/reports"
            element={<ReportsPage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />





        </Route>


        {/* ==================================================
            404
        ================================================== */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />

      </Routes>

      {/* ==================================================
            GLOBAL APP TOASTER
      ================================================== */}
      <AppToaster />


    </BrowserRouter>

  );

}