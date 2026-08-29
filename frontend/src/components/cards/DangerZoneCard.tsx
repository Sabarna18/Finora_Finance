// ======================================================
// src/features/settings/components/DangerZoneCard.tsx
// ======================================================

interface Props {

    loading: boolean;

    onDeactivate: () => void;

}

export default function DangerZoneCard({

    loading,

    onDeactivate,

}: Props) {

    function handleDeactivate() {

        const confirmed =
            window.confirm(
                "Are you sure you want to deactivate your account?"
            );

        if (!confirmed) {
            return;
        }

        onDeactivate();

    }


    return (

        <section
            className="
        rounded-2xl
        border
        border-red-200
        bg-red-800
        p-6
      "
        >

            <h2
                className="
          text-lg
          font-semibold
          text-red-600
        "
            >
                Danger Zone
            </h2>

            <p
                className="
          mt-2
          text-sm
          text-red-500
        "
            >
                Deactivating your account
                will disable access to your
                finance data.
            </p>

            <button
                onClick={handleDeactivate}
                disabled={loading}
                className="
          mt-5
          rounded-xl
          bg-red-600
          px-5
          py-3
          text-white
          disabled:opacity-50
        "
            >

                {loading
                    ? "Processing..."
                    : "Deactivate Account"}

            </button>

        </section>

    );

}