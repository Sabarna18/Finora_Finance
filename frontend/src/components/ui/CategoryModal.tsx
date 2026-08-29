// ======================================================
// src/components/ui/Modal.tsx
// ======================================================

import type {
    ReactNode,
} from "react";

import {
    X,
} from "lucide-react";


interface ModalProps {

    open: boolean;

    title: string;

    onClose: () => void;

    children: ReactNode;

}


export default function Modal({

    open,

    title,

    onClose,

    children,

}: ModalProps) {

    if (!open) {
        return null;
    }

    return (

        <div
            className="
        fixed
        inset-0
        z-50

        flex
        items-center
        justify-center

        bg-black/60
        backdrop-blur-sm

        p-4
      "
        >

            {/* BACKDROP */}
            <div
                className="
          absolute
          inset-0
        "
                onClick={onClose}
            />


            {/* MODAL */}
            <div
                className="
          relative

          w-full
          max-w-lg

          rounded-3xl

          border
          border-zinc-800

          bg-zinc-950

          shadow-2xl
        "
            >

                {/* HEADER */}
                <div
                    className="
            flex
            items-center
            justify-between

            border-b
            border-zinc-800

            px-6
            py-5
          "
                >

                    <h2
                        className="
              text-lg
              font-semibold
              text-zinc-100
            "
                    >
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="
              rounded-lg
              p-2

              text-zinc-400

              hover:bg-zinc-900
              hover:text-zinc-200
            "
                    >
                        <X size={18} />
                    </button>

                </div>

                {/* CONTENT */}
                <div
                    className="
            p-6
          "
                >
                    {children}
                </div>

            </div>

        </div>

    );

}