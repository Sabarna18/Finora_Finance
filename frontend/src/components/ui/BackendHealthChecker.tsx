// ======================================================
// src/components/BackendHealthChecker.tsx
// ======================================================
//
// Purpose:
//   Display the live backend availability on the landing page.
//
// Architecture:
//   LandingPage
//       ↓
//   BackendHealthChecker
//       ↓
//   centralized Axios client
//       ↓
//   GET /health
//
// The component intentionally uses the same API client as the
// rest of Finora instead of constructing a second API URL.
// This keeps the health check aligned with the application's
// real frontend → backend configuration.
// ======================================================

import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    CircleAlert,
    LoaderCircle,
} from "lucide-react";

import { api } from "../../api/client";

// ======================================================
// TYPES
// ======================================================

type BackendStatus =
    | "checking"
    | "online"
    | "offline";


// ======================================================
// STATUS CONFIGURATION
// ======================================================

const STATUS_CONFIG = {

    checking: {
        label: "Checking backend",
        dotClass:
            "bg-amber-400 animate-pulse",
        textClass:
            "text-amber-300",
        icon:
            LoaderCircle,
        iconClass:
            "animate-spin text-amber-400",
    },

    online: {
        label: "Backend operational",
        dotClass:
            "bg-emerald-400",
        textClass:
            "text-emerald-300",
        icon:
            CheckCircle2,
        iconClass:
            "text-emerald-400",
    },

    offline: {
        label: "Backend unavailable",
        dotClass:
            "bg-rose-400",
        textClass:
            "text-rose-300",
        icon:
            CircleAlert,
        iconClass:
            "text-rose-400",
    },

} as const;


// ======================================================
// COMPONENT
// ======================================================

export default function BackendHealthChecker() {

    const [
        status,
        setStatus,
    ] = useState<BackendStatus>(
        "checking"
    );


    useEffect(() => {

        let mounted = true;


        const checkBackendHealth =
            async () => {

                try {

                    /*
                     * Use the centralized Axios client.
                     *
                     * The client already knows the configured
                     * backend origin/API base URL, so this check
                     * cannot accidentally drift from the API
                     * configuration used by the application.
                     */

                    const response =
                        await api.get(
                            "/health",
                            {
                                timeout: 10000,
                            }
                        );


                    if (
                        mounted &&
                        response.status >= 200 &&
                        response.status < 300
                    ) {

                        setStatus(
                            "online"
                        );

                    }

                } catch {

                    if (mounted) {

                        setStatus(
                            "offline"
                        );

                    }

                }

            };


        checkBackendHealth();


        return () => {

            mounted = false;

        };

    }, []);


    const config =
        STATUS_CONFIG[status];

    const StatusIcon =
        config.icon;


    return (

        <div
            className="
                mt-4

                inline-flex
                items-center
                gap-2.5

                rounded-full

                border
                border-zinc-800

                bg-zinc-900/70

                px-3
                py-1.5

                text-xs
                font-medium

                shadow-sm
            "
            role="status"
            aria-live="polite"
        >

            <span
                aria-hidden="true"
                className={`
                    h-2
                    w-2
                    shrink-0
                    rounded-full

                    ${config.dotClass}
                `}
            />


            <span
                className={
                    config.textClass
                }
            >
                {config.label}
            </span>


            <StatusIcon
                aria-hidden="true"
                size={13}
                className={
                    config.iconClass
                }
            />

        </div>

    );

}
