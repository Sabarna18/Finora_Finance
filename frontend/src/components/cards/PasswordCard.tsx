// ======================================================
// src/features/settings/components/PasswordCard.tsx
// ======================================================

import {
    useState,
} from "react";

interface Props {

    loading: boolean;

    onSubmit: (
        payload: {
            current_password: string;
            new_password: string;
        }
    ) => void;

}

export default function PasswordCard({

    loading,

    onSubmit,

}: Props) {

    const [
        currentPassword,
        setCurrentPassword,
    ] = useState("");

    const [
        newPassword,
        setNewPassword,
    ] = useState("");


    function handleSubmit(
        e: React.FormEvent
    ) {

        e.preventDefault();

        onSubmit({
            current_password:
                currentPassword,
            new_password:
                newPassword,
        });

        setCurrentPassword("");
        setNewPassword("");

    }


    return (

        <section
            className="
        rounded-2xl
        border
        bg-zinc-900
        p-6
      "
        >

            <h2
                className="
          text-lg
          font-semibold
        "
            >
                Security
            </h2>

            <form
                onSubmit={handleSubmit}
                className="
          mt-6
          space-y-4
        "
            >

                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) =>
                        setCurrentPassword(
                            e.target.value
                        )
                    }
                    className="
            w-full
            rounded-xl
            border
            px-4
            py-3
          "
                />

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) =>
                        setNewPassword(
                            e.target.value
                        )
                    }
                    className="
            w-full
            rounded-xl
            border
            px-4
            py-3
          "
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="
            rounded-xl
            bg-black
            px-5
            py-3
            text-white
          "
                >

                    {loading
                        ? "Updating..."
                        : "Change Password"}

                </button>

            </form>

        </section>

    );

}