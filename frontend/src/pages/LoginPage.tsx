// ======================================================
// src/pages/LoginPage.tsx
// ======================================================

import {
  Link,
  Navigate,
} from "react-router-dom";

import {
  ArrowLeft,
} from "lucide-react";

import LoginForm
  from "../components/forms/loginForm";

import Logo
  from "../components/brands/Logo";

import {
  useAuthStore,
} from "../store/auth.store";


export default function LoginPage() {

  const isAuthenticated =
    useAuthStore(
      (state) =>
        state.isAuthenticated
    );


  // ====================================================
  // ALREADY AUTHENTICATED
  // ====================================================
  if (isAuthenticated) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return (

    <main
      className="
        relative

        min-h-screen

        flex
        items-center
        justify-center

        overflow-hidden

        bg-zinc-50

        px-4
        py-10

        dark:bg-zinc-950
      "
    >

      {/* ==================================================
          DECORATIVE BACKGROUND
      ================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-[-180px]

          h-[420px]
          w-[420px]

          -translate-x-1/2

          rounded-full

          bg-violet-500/10

          blur-3xl

          dark:bg-violet-500/10
        "
      />


      {/* ==================================================
          AUTH CONTAINER
      ================================================== */}
      <div
        className="
          relative
          z-10

          w-full
          max-w-md
        "
      >

        {/* ==================================================
            BRAND
        ================================================== */}
        <div
          className="
            mb-8

            flex
            justify-center
          "
        >

          <Link
            to="/"
            aria-label="Finora home"
            className="
              rounded-xl

              transition-opacity

              hover:opacity-90

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-violet-500
              focus-visible:ring-offset-4
            "
          >

            <Logo
              variant="full"
              size="lg"
            />

          </Link>

        </div>


        {/* ==================================================
            LOGIN CARD
        ================================================== */}
        <section
          className="
            rounded-3xl

            border
            border-zinc-200

            bg-white

            p-6

            shadow-xl
            shadow-zinc-200/40

            sm:p-8

            dark:border-zinc-800
            dark:bg-zinc-900
            dark:shadow-black/20
          "
        >

          {/* ================================================
              HEADER
          ================================================ */}
          <header
            className="
              mb-7
              text-center
            "
          >

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight

                text-zinc-950

                sm:text-3xl

                dark:text-zinc-50
              "
            >
              Welcome back
            </h1>


            <p
              className="
                mt-2

                text-sm
                leading-6

                text-zinc-500

                dark:text-zinc-400
              "
            >
              Sign in to manage your finances
              and track your financial progress.
            </p>

          </header>


          {/* ================================================
              FORM
          ================================================ */}
          <LoginForm />


          {/* ================================================
              REGISTER
          ================================================ */}
          <div
            className="
              mt-7

              border-t
              border-zinc-200

              pt-6

              text-center

              dark:border-zinc-800
            "
          >

            <p
              className="
                text-sm

                text-zinc-500

                dark:text-zinc-400
              "
            >
              Don't have an account?

              {" "}

              <Link
                to="/register"
                className="
                  font-semibold

                  text-violet-600

                  transition-colors

                  hover:text-violet-700

                  dark:text-violet-400
                  dark:hover:text-violet-300
                "
              >
                Create an account
              </Link>

            </p>

          </div>

        </section>


        {/* ==================================================
            BACK HOME
        ================================================== */}
        <nav
          className="
            mt-6
            flex
            justify-center
          "
        >

          <Link
            to="/"
            className="
              inline-flex
              items-center
              gap-2

              rounded-lg

              px-3
              py-2

              text-sm
              font-medium

              text-zinc-500

              transition-colors

              hover:text-zinc-900

              dark:text-zinc-400
              dark:hover:text-zinc-100
            "
          >

            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Back to home

          </Link>

        </nav>


        {/* ==================================================
            PRODUCT FOOTER
        ================================================== */}
        <p
          className="
            mt-5

            text-center

            text-xs

            text-zinc-400

            dark:text-zinc-600
          "
        >
          Secure personal finance management
          with Finora
        </p>

      </div>

    </main>

  );

}

