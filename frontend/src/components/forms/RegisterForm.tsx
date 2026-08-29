import {
  FormEvent,
  useState,
} from "react";

import {
  useRegister,
} from "../../hooks/useRegister";


export default function RegisterForm() {

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");


  const {

    mutate,

    isPending,

    error,

  } = useRegister();


  function handleSubmit(
    e: FormEvent
  ) {

    e.preventDefault();


    mutate({

      name:
        name.trim(),

      email:
        email.trim(),

      password,

    });

  }


  const isDisabled =

    !name.trim()

    || !email.trim()

    || password.length < 6

    || isPending;


  return (

    <form
      onSubmit={
        handleSubmit
      }
      className="
        space-y-5
      "
    >

      {/* NAME */}
      <div>

        <label
          className="
            block
            mb-2
            text-sm
            font-medium
          "
        >
          Name
        </label>

        <input

          type="text"

          value={name}

          onChange={
            (e) =>
              setName(
                e.target.value
              )
          }

          className="
            w-full
            border
            rounded-lg
            px-4
            py-3
          "

          required
        />

      </div>


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

          onChange={
            (e) =>
              setEmail(
                e.target.value
              )
          }

          className="
            w-full
            border
            rounded-lg
            px-4
            py-3
          "

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

          onChange={
            (e) =>
              setPassword(
                e.target.value
              )
          }

          className="
            w-full
            border
            rounded-lg
            px-4
            py-3
          "

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
          Registration failed
        </p>

      )}


      {/* BUTTON */}
      <button

        type="submit"

        disabled={
          isDisabled
        }

        className="
          w-full
          border
          rounded-lg
          py-3
          disabled:opacity-50
        "
      >

        {

          isPending

            ? "Creating account..."

            : "Create Account"

        }

      </button>

    </form>

  );

}