// ======================================================
// src/components/feedback/FieldError.tsx
// ======================================================

import {
    CircleAlert,
} from "lucide-react";


// ======================================================
// TYPES
// ======================================================

interface FieldErrorProps {

    /**
     * Validation message associated
     * with the field.
     */
    message?: string | null;


    /**
     * ID referenced by the input's
     * aria-describedby attribute.
     */
    id?: string;


    /**
     * Optional additional styling.
     */
    className?: string;

}


// ======================================================
// COMPONENT
// ======================================================

export default function FieldError({
    message,
    id,
    className = "",
}: FieldErrorProps) {


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

        <p
            id={id}

            role="alert"

            className={`
        mt-1.5

        flex
        items-start
        gap-1.5

        text-xs
        font-medium
        leading-5

        text-red-600

        dark:text-red-400

        ${className}
      `}
        >

            <CircleAlert
                size={14}

                aria-hidden="true"

                className="
          mt-0.5
          shrink-0
        "
            />


            <span>
                {message}
            </span>

        </p>

    );

}