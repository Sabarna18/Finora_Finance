// ======================================================
// src/components/tables/TransactionRow.tsx
// ======================================================

import {
    Pencil,
    Trash2,
} from "lucide-react";

import {
    TransactionResponse,
    TransactionType,
} from "../../api/transactions.api";


interface Props {

    transaction:
    TransactionResponse;

    categoryName:
    string;

    onEdit: (
        transaction:
            TransactionResponse
    ) => void;

    onDelete: (
        id: number
    ) => void;

}


export default function TransactionRow({

    transaction,

    categoryName,

    onEdit,

    onDelete,

}: Props) {

    const isIncome =
        transaction.type ===
        TransactionType.INCOME;


    return (

        <div
            className="
                grid
                grid-cols-14
                gap-4

                border-b
                border-zinc-800

                px-6
                py-5

                transition-colors

                hover:bg-zinc-900/70
            "
        >

            {/* ======================================
                DESCRIPTION
            ====================================== */}
            <div className="col-span-3">

                <p
                    className="
            text-sm
            font-medium
            text-white
        "
                >
                    {
                        transaction.description ||
                        "No Description"
                    }
                </p>

                <p
                    className="
            mt-1

            text-xs
            text-zinc-500
        "
                >
                    Created on{" "}
                    {
                        new Date(
                            transaction.created_at
                        ).toLocaleString(
                            "en-IN",
                            {
                                dateStyle: "medium",
                                timeStyle: "short",
                            }
                        )
                    }
                </p>

            </div>


            {/* ======================================
                CATEGORY
            ====================================== */}
            <div className="col-span-2">

                <span
                    className="
                        inline-flex
                        items-center

                        rounded-full

                        border
                        border-violet-500/30

                        bg-violet-500/10

                        px-3
                        py-1

                        text-xs
                        font-medium

                        text-violet-300
                    "
                >
                    {categoryName}
                </span>

            </div>


            {/* ======================================
                TYPE
            ====================================== */}
            <div className="col-span-2">

                <span
                    className={`
                        rounded-full

                        px-3
                        py-1

                        text-xs
                        font-medium

                        ${isIncome
                            ? `
                                    bg-emerald-500/10
                                    text-emerald-400
                                `
                            : `
                                    bg-red-500/10
                                    text-red-400
                                `
                        }
                    `}
                >
                    {transaction.type}
                </span>

            </div>


            {/* ======================================
                AMOUNT
            ====================================== */}
            <div className="col-span-2">

                <span
                    className={`
                        text-sm
                        font-semibold

                        ${isIncome
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                    `}
                >
                    ₹
                    {transaction.amount.toLocaleString(
                        "en-IN"
                    )}
                </span>

            </div>


            {/* ======================================
                DATE
            ====================================== */}
            <div
                className="
                    col-span-2

                    text-sm
                    text-zinc-400
                "
            >
                {
                    transaction.date
                        ? new Date(
                            transaction.date
                        ).toLocaleDateString(
                            "en-IN",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        )
                        : "-"
                }
            </div>


            {/* ======================================
                ACTIONS
            ====================================== */}
            <div
                className="
                    col-span-3

                    flex
                    items-center
                    gap-2
                "
            >

                <button

                    onClick={() =>
                        onEdit(
                            transaction
                        )
                    }

                    className="
                        rounded-lg

                        border
                        border-zinc-700

                        p-2

                        text-zinc-300

                        transition-colors

                        hover:bg-zinc-800
                        hover:text-white
                    "
                >
                    <Pencil size={14} />
                </button>


                <button

                    onClick={() =>
                        onDelete(
                            transaction.id
                        )
                    }

                    className="
                        rounded-lg

                        border
                        border-red-900

                        p-2

                        text-red-400

                        transition-colors

                        hover:bg-red-950/50
                    "
                >
                    <Trash2 size={14} />
                </button>

            </div>

        </div>

    );

}