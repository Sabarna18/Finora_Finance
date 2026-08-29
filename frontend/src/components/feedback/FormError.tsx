// ======================================================
// src/components/feedback/FormError.tsx
// ======================================================

import {
    CircleAlert,
} from "lucide-react";


// ======================================================
// TYPES
// ======================================================

interface FormErrorProps {

    /**
     * Main error message displayed
     * to the user.
     */
    message?: string | null;


    /**
     * Optional heading.
     *
     * Useful for more significant
     * submission failures.
     */
    title?: string;


    /**
     * Optional additional styling.
     */
    className?: string;

}


// ======================================================
// COMPONENT
// ======================================================

export default function FormError({
    message,
    title,
    className = "",
}: FormErrorProps) {


    // ====================================================
    // NO ERROR
    // ====================================================

    if (!message) {
        return null;
    }


    // ====================================================
    // RENDER
    // ====================================================

    return (

        <div
            role="alert"

            aria-live="polite"

            className={`
        flex
        items-start
        gap-3

        rounded-xl

        border
        border-red-200

        bg-red-50

        px-4
        py-3.5

        text-red-800

        dark:border-red-500/20
        dark:bg-red-500/10
        dark:text-red-300

        ${className}
      `}
        >

            {/* ICON */}

            <CircleAlert
                size={18}

                aria-hidden="true"

                className="
          mt-0.5
          shrink-0
        "
            />


            {/* CONTENT */}

            <div
                className="
          min-w-0
        "
            >

                {title && (

                    <p
                        className="
              text-sm
              font-semibold
            "
                    >
                        {title}
                    </p>

                )}


                <p
                    className={`
            text-sm
            leading-6

            ${title
                            ? "mt-0.5"
                            : ""
                        }
          `}
                >
                    {message}
                </p>

            </div>

        </div>

    );

}