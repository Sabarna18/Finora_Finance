// ======================================================
// src/components/brand/Logo.tsx
// ======================================================

import logo from "../../assets/brand/logo.png";


// ======================================================
// TYPES
// ======================================================
type LogoVariant =
    | "mark"
    | "brand"
    | "full";

type LogoSize =
    | "sm"
    | "md"
    | "lg"
    | "xl";


interface LogoProps {
    variant?: LogoVariant;

    size?: LogoSize;

    className?: string;
}


// ======================================================
// BRAND CONFIG
// ======================================================
const BRAND = {
    name: "Finora",
    tagline: "Personal Finance",
};


// ======================================================
// SIZE CONFIG
// ======================================================
const sizes = {

    sm: {
        image: "h-8 w-8",
        title: "text-sm",
        subtitle: "text-[10px]",
        gap: "gap-2",
    },

    md: {
        image: "h-10 w-10",
        title: "text-base",
        subtitle: "text-xs",
        gap: "gap-3",
    },

    lg: {
        image: "h-14 w-14",
        title: "text-xl",
        subtitle: "text-sm",
        gap: "gap-4",
    },

    xl: {
        image: "h-20 w-20",
        title: "text-2xl",
        subtitle: "text-sm",
        gap: "gap-5",
    },

};


// ======================================================
// COMPONENT
// ======================================================
export default function Logo({

    variant = "full",

    size = "md",

    className = "",

}: LogoProps) {

    const styles =
        sizes[size];


    // ====================================================
    // MARK ONLY
    // ====================================================
    if (variant === "mark") {

        return (

            <img
                src={logo}
                alt={BRAND.name}
                className={`
          shrink-0
          object-contain
          ${styles.image}
          ${className}
        `}
            />

        );

    }


    // ====================================================
    // BRAND
    // ====================================================
    return (

        <div
            className={`
        inline-flex
        items-center
        ${styles.gap}
        ${className}
      `}
        >

            {/* LOGO MARK */}

            <img
                src={logo}
                alt=""
                aria-hidden="true"
                className={`
          shrink-0
          object-contain
          ${styles.image}
        `}
            />


            {/* BRAND TEXT */}

            <div
                className="
          min-w-0
          leading-none
        "
            >

                <div
                    className={`
            font-bold
            tracking-tight

            text-zinc-950
            dark:text-zinc-50

            ${styles.title}
          `}
                >
                    {BRAND.name}
                </div>


                {/* TAGLINE */}

                {variant === "full" && (

                    <div
                        className={`
              mt-1

              font-medium

              text-zinc-500
              dark:text-zinc-400

              ${styles.subtitle}
            `}
                    >
                        {BRAND.tagline}
                    </div>

                )}

            </div>

        </div>

    );

}