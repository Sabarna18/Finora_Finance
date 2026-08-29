// ======================================================
// src/components/ui/AppToaster.tsx
// ======================================================

import {
    Toaster,
} from "sonner";


// ======================================================
// APP TOASTER
// ======================================================

export default function AppToaster() {

    return (

        <Toaster

            // --------------------------------------------------
            // POSITION
            // --------------------------------------------------
            position="top-right"


            // --------------------------------------------------
            // BEHAVIOUR
            // --------------------------------------------------
            duration={4000}

            closeButton

            richColors={false}

            expand={false}

            visibleToasts={4}


            // --------------------------------------------------
            // ACCESSIBILITY
            // --------------------------------------------------
            gap={10}


            // --------------------------------------------------
            // GLOBAL STYLING
            // --------------------------------------------------
            toastOptions={{

                classNames: {

                    toast: `
            !rounded-2xl

            !border
            !border-zinc-200

            !bg-white

            !px-4
            !py-4

            !shadow-xl
            !shadow-zinc-950/10

            dark:!border-zinc-800
            dark:!bg-zinc-900
            dark:!shadow-black/30
          `,

                    title: `
            !text-sm
            !font-semibold

            !text-zinc-950

            dark:!text-zinc-50
          `,

                    description: `
            !text-sm
            !leading-5

            !text-zinc-500

            dark:!text-zinc-400
          `,

                    success: `
            !border-emerald-500/20
          `,

                    error: `
            !border-red-500/20
          `,

                    warning: `
            !border-amber-500/20
          `,

                    info: `
            !border-blue-500/20
          `,

                    closeButton: `
            !border-zinc-200
            !bg-white

            !text-zinc-500

            hover:!bg-zinc-100
            hover:!text-zinc-950

            dark:!border-zinc-700
            dark:!bg-zinc-800
            dark:!text-zinc-400

            dark:hover:!bg-zinc-700
            dark:hover:!text-white
          `,

                    actionButton: `
            !rounded-lg

            !bg-violet-600

            !px-3
            !py-2

            !text-xs
            !font-semibold

            !text-white

            hover:!bg-violet-500
          `,

                    cancelButton: `
            !rounded-lg

            !bg-zinc-100

            !px-3
            !py-2

            !text-xs
            !font-semibold

            !text-zinc-700

            dark:!bg-zinc-800
            dark:!text-zinc-300
          `,

                },

            }}

        />

    );

}