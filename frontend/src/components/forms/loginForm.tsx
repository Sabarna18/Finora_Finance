import {
  useState,
  FormEvent,
} from "react";

import {
  useLogin,
} from "../../hooks/useLogin";


export default function LoginForm() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");


  const {
    mutate,
    isPending,
    error,
  } = useLogin();


  function handleSubmit(
    e: FormEvent
  ) {

    e.preventDefault();

    mutate({
      email: email.trim(),
      password,
    });

  }


  const isDisabled =
    !email.trim()
    || !password.trim()
    || isPending;


  return (

    <form
      onSubmit={handleSubmit}
      className="
        space-y-5
      "
    >

      {/* EMAIL */}
      <div>

        <label
          className="
            block
            mb-2
            text-sm
            font-medium
          "
        >
          Email
        </label>

        <input
          type="email"

          value={email}

          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }

          className="
            w-full
            rounded-lg
            border
            px-4
            py-3
            outline-none
          "

          placeholder="john@example.com"

          autoComplete="email"

          required
        />

      </div>


      {/* PASSWORD */}
      <div>

        <label
          className="
            block
            mb-2
            text-sm
            font-medium
          "
        >
          Password
        </label>

        <input
          type="password"

          value={password}

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }

          className="
            w-full
            rounded-lg
            border
            px-4
            py-3
            outline-none
          "

          autoComplete="current-password"

          required
        />

      </div>


      {/* ERROR */}
      {error && (

        <p
          className="
            text-sm
            text-red-600
          "
        >
          Invalid credentials
        </p>

      )}


      {/* SUBMIT */}
      <button

        type="submit"

        disabled={isDisabled}

        className="
          w-full
          rounded-lg
          py-3
          font-medium
          border
          disabled:opacity-50
        "
      >

        {
          isPending
            ? "Signing in..."
            : "Sign In"
        }

      </button>

    </form>

  );

}