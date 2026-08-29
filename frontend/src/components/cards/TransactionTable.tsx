// ======================================================
// src/components/tables/TransactionTable.tsx
// ======================================================

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import TransactionRow
    from "./TransactionRow";

import type {
    Category,
} from "../../types/api";

import {
    TransactionResponse,
} from "../../api/transactions.api";


interface Props {

    transactions:
    TransactionResponse[];

    categories:
    Category[];

    onEdit: (
        transaction:
            TransactionResponse
    ) => void;

    onDelete: (
        id: number
    ) => void;

}


export default function TransactionTable({

    transactions,

    categories,

    onEdit,

    onDelete,

}: Props) {

    // ==================================================
    // PAGINATION
    // ==================================================
    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);


    const [
        pageSize,
        setPageSize,
    ] = useState(10);


    useEffect(() => {

        setCurrentPage(1);

    }, [pageSize]);


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                transactions.length /
                pageSize
            )
        );


    const paginatedTransactions =
        useMemo(() => {

            const start =
                (currentPage - 1)
                * pageSize;

            const end =
                start +
                pageSize;

            return transactions.slice(
                start,
                end
            );

        }, [
            transactions,
            currentPage,
            pageSize,
        ]);


    const startEntry =
        transactions.length === 0

            ? 0

            : (
                (
                    currentPage - 1
                ) * pageSize
            ) + 1;


    const endEntry =
        Math.min(
            currentPage *
            pageSize,

            transactions.length
        );


    // ==================================================
    // CATEGORY LOOKUP
    // ==================================================
    const categoryMap =
        useMemo(
            () =>
                new Map(
                    categories.map(
                        (
                            category
                        ) => [

                                category.id,

                                category.name,

                            ]
                    )
                ),
            [categories]
        );


    return (

        <div>

            {/* ======================================
                HEADER
            ====================================== */}
            <div
                className="
                    grid
                    grid-cols-14
                    gap-4

                    border-b
                    border-zinc-800

                    px-6
                    py-4

                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide

                    text-zinc-500
                "
            >

                <div className="col-span-3">
                    Description
                </div>

                <div className="col-span-2">
                    Category
                </div>

                <div className="col-span-2">
                    Type
                </div>

                <div className="col-span-2">
                    Amount
                </div>

                <div className="col-span-2">
                    Date
                </div>

                <div className="col-span-3">
                    Actions
                </div>

            </div>


            {/* ======================================
                EMPTY STATE
            ====================================== */}
            {transactions.length === 0 && (

                <div
                    className="
                        px-6
                        py-16

                        text-center
                        text-zinc-500
                    "
                >
                    No transactions found.
                </div>

            )}


            {/* ======================================
                ROWS
            ====================================== */}
            {paginatedTransactions.map(
                (transaction) => (

                    <TransactionRow

                        key={
                            transaction.id
                        }

                        transaction={
                            transaction
                        }

                        categoryName={

                            transaction.category_id

                                ? categoryMap.get(
                                    transaction.category_id
                                ) ??
                                "Unknown"

                                : "Uncategorized"

                        }

                        onEdit={
                            onEdit
                        }

                        onDelete={
                            onDelete
                        }

                    />

                )
            )}


            {/* ======================================
                PAGINATION
            ====================================== */}
            {transactions.length > 0 && (

                <div
                    className="
                        flex
                        flex-col
                        gap-4

                        border-t
                        border-zinc-800

                        px-6
                        py-5

                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                    "
                >

                    {/* LEFT */}
                    <div
                        className="
                            text-sm
                            text-zinc-400
                        "
                    >

                        Showing

                        <span
                            className="
                                mx-1
                                font-semibold
                                text-white
                            "
                        >
                            {startEntry}
                        </span>

                        -

                        <span
                            className="
                                mx-1
                                font-semibold
                                text-white
                            "
                        >
                            {endEntry}
                        </span>

                        of

                        <span
                            className="
                                ml-1
                                font-semibold
                                text-violet-400
                            "
                        >
                            {transactions.length}
                        </span>

                        transactions

                    </div>


                    {/* CENTER */}
                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <button

                            onClick={() =>
                                setCurrentPage(
                                    (prev) =>
                                        Math.max(
                                            1,
                                            prev - 1
                                        )
                                )
                            }

                            disabled={
                                currentPage === 1
                            }

                            className="
                                rounded-xl

                                border
                                border-zinc-700

                                px-4
                                py-2

                                text-sm

                                transition-all

                                hover:border-violet-500

                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            ← Previous
                        </button>


                        <div
                            className="
                                rounded-xl

                                border
                                border-violet-500/20

                                bg-violet-500/10

                                px-4
                                py-2

                                text-sm
                                font-medium

                                text-violet-300
                            "
                        >
                            Page {currentPage}
                            {" "}of{" "}
                            {totalPages}
                        </div>


                        <button

                            onClick={() =>
                                setCurrentPage(
                                    (prev) =>
                                        Math.min(
                                            totalPages,
                                            prev + 1
                                        )
                                )
                            }

                            disabled={
                                currentPage ===
                                totalPages
                            }

                            className="
                                rounded-xl

                                border
                                border-zinc-700

                                px-4
                                py-2

                                text-sm

                                transition-all

                                hover:border-violet-500

                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            Next →
                        </button>

                    </div>


                    {/* RIGHT */}
                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <span
                            className="
                                text-sm
                                text-zinc-500
                            "
                        >
                            Rows per page
                        </span>

                        <select

                            value={
                                pageSize
                            }

                            onChange={(e) =>
                                setPageSize(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }

                            className="
                                rounded-xl

                                border
                                border-zinc-700

                                bg-zinc-900

                                px-3
                                py-2

                                text-sm
                                text-white

                                outline-none

                                focus:border-violet-500
                            "
                        >

                            <option value={5}>
                                5
                            </option>

                            <option value={10}>
                                10
                            </option>

                            <option value={20}>
                                20
                            </option>

                            <option value={50}>
                                50
                            </option>

                        </select>

                    </div>

                </div>

            )}

        </div>

    );

}