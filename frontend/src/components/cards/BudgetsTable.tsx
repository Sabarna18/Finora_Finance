// ======================================================
// src/components/cards/BudgetsTable.tsx
// ======================================================

import {
    Pencil,
    Trash2,
} from "lucide-react";

import type {
    Budget,
    Category,
} from "../../types/api";

import type {
    BudgetStatusItem,
} from "../../api/dashboard.api";


interface Props {

    budgets: Budget[];

    categories: Category[];

    statuses: BudgetStatusItem[];

    onEdit: (
        budget: Budget
    ) => void;

    onDelete: (
        budgetId: number
    ) => void;

}


export default function BudgetsTable({

    budgets,

    categories,

    statuses,

    onEdit,

    onDelete,

}: Props) {

    // ==================================================
    // LOOKUPS
    // ==================================================
    const categoryMap =
        new Map(

            categories.map(
                (category) => [

                    category.id,

                    category.name,

                ]
            )

        );

    const statusMap =
        new Map(

            statuses.map(
                (status) => [

                    status.budget_id,

                    status,

                ]
            )

        );


    // ==================================================
    // EMPTY STATE
    // ==================================================
    if (
        budgets.length === 0
    ) {

        return (

            <div
                className="
                    rounded-2xl
                    border
                    p-12
                    text-center
                "
            >

                <h3
                    className="
                        text-lg
                        font-semibold
                    "
                >
                    No Budgets Found
                </h3>

                <p
                    className="
                        mt-2
                        text-sm
                        text-zinc-500
                    "
                >
                    Create your first budget
                    to start tracking spending.
                </p>

            </div>

        );

    }


    return (

        <div
            className="
                overflow-hidden
                rounded-2xl
                border
            "
        >

            <div
                className="
                    overflow-x-auto
                "
            >

                <table
                    className="
                        w-full
                        min-w-[1200px]
                    "
                >

                    {/* =====================================
                        HEADER
                    ===================================== */}
                    <thead>

                        <tr
                            className="
                                border-b
                                bg-zinc-850
                            "
                        >

                            <th className="p-4 text-left">
                                Budget
                            </th>

                            <th className="p-4 text-left">
                                Category
                            </th>

                            <th className="p-4 text-left">
                                Month
                            </th>

                            <th className="p-4 text-left">
                                Spent
                            </th>

                            <th className="p-4 text-left">
                                Remaining
                            </th>

                            <th className="p-4 text-left">
                                Usage
                            </th>

                            <th className="p-4 text-left">
                                Status
                            </th>

                            <th className="p-4 text-right">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    {/* =====================================
                        BODY
                    ===================================== */}
                    <tbody>

                        {budgets.map(
                            (budget) => {

                                const status =
                                    statusMap.get(
                                        budget.id
                                    );

                                const percentage =
                                    status?.percentage_used ??
                                    0;

                                const categoryName =
                                    budget.category_id
                                        ? (
                                            categoryMap.get(
                                                budget.category_id
                                            ) ??
                                            "Unknown"
                                        )
                                        : "Overall Budget";

                                return (

                                    <tr
                                        key={budget.id}
                                        className="
                                            border-b
                                            transition-colors
                                            hover:bg-zinc-800
                                            cursor-pointer
                                        "
                                    >

                                        {/* Budget */}
                                        <td className="p-4">

                                            <div
                                                className="
                                                    font-semibold
                                                "
                                            >
                                                ₹
                                                {budget.amount.toLocaleString()}
                                            </div>

                                        </td>


                                        {/* Category */}
                                        <td className="p-4">

                                            <span
                                                className="
                                                    rounded-full
                                                    border
                                                    px-3
                                                    py-1
                                                    text-xs
                                                    font-medium
                                                "
                                            >
                                                {categoryName}
                                            </span>

                                        </td>


                                        {/* Month */}
                                        <td className="p-4">

                                            {new Date(
                                                budget.year,
                                                budget.month - 1
                                            ).toLocaleString(
                                                "default",
                                                {
                                                    month: "long",
                                                }
                                            )}

                                            {" "}

                                            {budget.year}

                                        </td>


                                        {/* Spent */}
                                        <td className="p-4">

                                            ₹
                                            {(
                                                status?.spent_amount ??
                                                0
                                            ).toLocaleString()}

                                        </td>


                                        {/* Remaining */}
                                        <td className="p-4">

                                            <span
                                                className={
                                                    (
                                                        status?.remaining_amount ??
                                                        budget.amount
                                                    ) < 0
                                                        ? "text-red-500"
                                                        : "text-green-600"
                                                }
                                            >

                                                ₹
                                                {(
                                                    status?.remaining_amount ??
                                                    budget.amount
                                                ).toLocaleString()}

                                            </span>

                                        </td>


                                        {/* Usage */}
                                        <td className="p-4">

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                "
                                            >

                                                <div
                                                    className="
                                                        h-2
                                                        w-28
                                                        rounded-full
                                                        bg-zinc-200
                                                    "
                                                >

                                                    <div

                                                        style={{
                                                            width:
                                                                `${Math.min(
                                                                    percentage,
                                                                    100
                                                                )}%`,
                                                        }}

                                                        className={`
                                                            h-full
                                                            rounded-full

                                                            ${status?.status ===
                                                                "Exceeded"

                                                                ? "bg-red-500"

                                                                : status?.status ===
                                                                    "Warning"

                                                                    ? "bg-yellow-500"

                                                                    : "bg-green-500"
                                                            }
                                                        `}

                                                    />

                                                </div>

                                                <span
                                                    className="
                                                        text-sm
                                                        font-medium
                                                    "
                                                >

                                                    {percentage}%

                                                </span>

                                            </div>

                                        </td>


                                        {/* Status */}
                                        <td className="p-4">

                                            <span
                                                className={`
                                                    rounded-full
                                                    px-3
                                                    py-1

                                                    text-xs
                                                    font-semibold

                                                    ${status?.status ===
                                                        "Exceeded"

                                                        ? "bg-red-100 text-red-700"

                                                        : status?.status ===
                                                            "Warning"

                                                            ? "bg-yellow-100 text-yellow-700"

                                                            : "bg-green-100 text-green-700"
                                                    }
                                                `}
                                            >

                                                {
                                                    status?.status ??
                                                    "Healthy"
                                                }

                                            </span>

                                        </td>


                                        {/* Actions */}
                                        <td className="p-4">

                                            <div
                                                className="
                                                    flex
                                                    justify-end
                                                    gap-2
                                                "
                                            >

                                                <button

                                                    onClick={() =>
                                                        onEdit(
                                                            budget
                                                        )
                                                    }

                                                    className="
                                                        rounded-lg
                                                        p-2

                                                        transition-colors

                                                        hover:bg-zinc-100
                                                    "
                                                >

                                                    <Pencil
                                                        size={16}
                                                    />

                                                </button>

                                                <button

                                                    onClick={() =>
                                                        onDelete(
                                                            budget.id
                                                        )
                                                    }

                                                    className="
                                                        rounded-lg
                                                        p-2

                                                        text-red-500

                                                        transition-colors

                                                        hover:bg-red-50
                                                    "
                                                >

                                                    <Trash2
                                                        size={16}
                                                    />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                );

                            }
                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );

}