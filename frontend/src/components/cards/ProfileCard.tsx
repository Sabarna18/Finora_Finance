// ======================================================
// src/features/settings/components/ProfileCard.tsx
// ======================================================

import {
    useEffect,
    useState,
} from "react";

import type {
    UserProfile,
} from "../../api/settings.api";

interface Props {

    profile?: UserProfile;

    loading: boolean;

    onSubmit: (
        payload: {
            name: string;
            email: string;
        }
    ) => void;

}

export default function ProfileCard({

    profile,

    loading,

    onSubmit,

}: Props) {

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");


    useEffect(() => {

        if (!profile) {
            return;
        }

        setName(profile.name);
        setEmail(profile.email);

    }, [profile]);


    function handleSubmit(
        e: React.FormEvent
    ) {

        e.preventDefault();

        onSubmit({
            name: name.trim(),
            email: email.trim(),
        });

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
                Profile Information
            </h2>

            <form
                onSubmit={handleSubmit}
                className="
          mt-6
          space-y-4
        "
            >

                <div>

                    <label
                        className="
              mb-2
              block
              text-sm
              font-medium
            "
                    >
                        Name
                    </label>

                    <input
                        value={name}
                        onChange={(e) =>
                            setName(
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

                </div>

                <div>

                    <label
                        className="
              mb-2
              block
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
              rounded-xl
              border
              px-4
              py-3
            "
                    />

                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="
            rounded-xl
            bg-black
            px-5
            py-3
            text-white
            disabled:opacity-50
          "
                >

                    {loading
                        ? "Saving..."
                        : "Update Profile"}

                </button>

            </form>

        </section>

    );

}