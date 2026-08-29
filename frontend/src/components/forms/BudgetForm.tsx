// ======================================================
// src/features/budgets/components/BudgetForm.tsx
// ======================================================

import {
    useEffect,
    useMemo,
    useState,
} from "react";


import { getCategories } from "../../api/categories.api";

import type {
    Budget,
    Category,
} from "../../types/api";

import {
    TransactionType,
} from "../../types/api";


interface Props {

    budget?: Budget;

    loading: boolean;

    onSubmit: (
        payload: {
            amount: number;
            month: number;
            year: number;
            category_id: number | null;
        }
    ) => void;

}


// ======================================================
// MONTHS
// ======================================================
const months = [

    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },

];


// ======================================================
// COMPONENT
// ======================================================
export default function BudgetForm({

    budget,

    loading,

    onSubmit,

}: Props) {

    const currentDate =
        new Date();


    // ====================================================
    // FORM STATE
    // ====================================================
    const [
        amount,
        setAmount,
    ] = useState(
        budget?.amount ?? 0
    );

    const [
        month,
        setMonth,
    ] = useState(
        budget?.month ??
        currentDate.getMonth() + 1
    );

    const [
        year,
        setYear,
    ] = useState(
        budget?.year ??
        currentDate.getFullYear()
    );

    const [
        categoryId,
        setCategoryId,
    ] = useState<
        number | null
    >(
        budget?.category_id ??
        null
    );

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);


    // ====================================================
    // CATEGORIES
    // ====================================================
    const [
        categories,
        setCategories,
    ] = useState<Category[]>([]);

    const [
        categoriesLoading,
        setCategoriesLoading,
    ] = useState(false);


    // ====================================================
    // LOAD CATEGORIES
    // ====================================================
    useEffect(() => {

        async function loadCategories() {

            try {

                setCategoriesLoading(
                    true
                );

                const data =
                    await getCategories();

                setCategories(

                    data.filter(
                        (category) =>
                            category.type ===
                            TransactionType.EXPENSE
                    )

                );

            } catch (error) {

                console.error(
                    "Failed to load categories",
                    error
                );

            } finally {

                setCategoriesLoading(
                    false
                );

            }

        }

        loadCategories();

    }, []);


    // ====================================================
    // YEARS
    // ====================================================
    const years =
        useMemo(() => {

            const currentYear =
                new Date()
                    .getFullYear();

            return Array.from(
                { length: 6 },
                (_, index) =>
                    currentYear - index
            );

        }, []);


    // ====================================================
    // SUBMIT
    // ====================================================
    function handleSubmit(
        e: React.FormEvent
    ) {

        e.preventDefault();

        setError(null);

        if (
            amount <= 0
        ) {

            setError(
                "Budget amount must be greater than zero."
            );

            return;

        }

        onSubmit({

            amount,

            month,

            year,

            category_id:
                categoryId,

        });

    }


    return (

        <form
            onSubmit={
                handleSubmit
            }
            className="
        space-y-5
      "
        >

            {/* ======================================
          HEADER
      ====================================== */}
            <div>

                <h2
                    className="
            text-lg
            font-semibold
            text-white
          "
                >
                    {budget
                        ? "Edit Budget"
                        : "Create Budget"}
                </h2>

                <p
                    className="
            mt-1
            text-sm
            text-zinc-400
          "
                >
                    Set monthly spending limits
                    and monitor expenses.
                </p>

            </div>


            {/* ======================================
          AMOUNT
      ====================================== */}
            <div>

                <label
                    className="
            mb-2
            block
            text-sm
            font-medium
            text-zinc-300
          "
                >
                    Budget Amount
                </label>

                <input

                    type="number"

                    step="1.00"

                    value={amount}

                    onChange={(e) =>
                        setAmount(
                            Number(
                                e.target.value
                            )
                        )
                    }

                    placeholder="Enter budget amount"

                    className={`
            w-full
            rounded-xl
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none

            ${amount <= 0
                            ? "border border-red-500"
                            : "border border-zinc-700"
                        }

            focus:border-violet-500
          `}
                />

            </div>


            {/* ======================================
          MONTH
      ====================================== */}
            <div>

                <label
                    className="
            mb-2
            block
            text-sm
            font-medium
            text-zinc-300
          "
                >
                    Budget Month
                </label>

                <select

                    value={month}

                    onChange={(e) =>
                        setMonth(
                            Number(
                                e.target.value
                            )
                        )
                    }

                    className="
            w-full
            rounded-xl
            border
            border-zinc-700
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            focus:border-violet-500
          "
                >

                    {months.map(
                        (month) => (

                            <option
                                key={month.value}
                                value={month.value}
                            >
                                {month.label}
                            </option>

                        )
                    )}

                </select>

            </div>


            {/* ======================================
          YEAR
      ====================================== */}
            <div>

                <label
                    className="
            mb-2
            block
            text-sm
            font-medium
            text-zinc-300
          "
                >
                    Budget Year
                </label>

                <select

                    value={year}

                    onChange={(e) =>
                        setYear(
                            Number(
                                e.target.value
                            )
                        )
                    }

                    className="
            w-full
            rounded-xl
            border
            border-zinc-700
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            focus:border-violet-500
          "
                >

                    {years.map(
                        (year) => (

                            <option
                                key={year}
                                value={year}
                            >
                                {year}
                            </option>

                        )
                    )}

                </select>

            </div>


            {/* ======================================
          CATEGORY
      ====================================== */}
            <div>

                <label
                    className="
            mb-2
            block
            text-sm
            font-medium
            text-zinc-300
          "
                >
                    Budget Category
                </label>

                <select

                    value={
                        categoryId ?? ""
                    }

                    onChange={(e) =>
                        setCategoryId(
                            e.target.value
                                ? Number(
                                    e.target.value
                                )
                                : null
                        )
                    }

                    disabled={
                        categoriesLoading
                    }

                    className="
            w-full
            rounded-xl
            border
            border-zinc-700
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            focus:border-violet-500
          "
                >

                    <option value="">
                        Overall Budget
                    </option>

                    {categories.map(
                        (category) => (

                            <option
                                key={category.id}
                                value={category.id}
                            >
                                {category.name}
                            </option>

                        )
                    )}

                </select>

            </div>


            {/* ======================================
          ERROR
      ====================================== */}
            {error && (

                <div
                    className="
            rounded-xl
            border
            border-red-500/30
            bg-red-500/10
            px-4
            py-3
          "
                >

                    <p
                        className="
              text-sm
              text-red-300
            "
                    >
                        {error}
                    </p>

                </div>

            )}


            {/* ======================================
          SUBMIT
      ====================================== */}
            <button

                type="submit"

                disabled={loading}

                className="
          w-full
          rounded-xl
          bg-white
          px-4
          py-3
          font-semibold
          text-black

          transition-all

          hover:opacity-90

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
            >

                {loading
                    ? "Saving..."
                    : budget
                        ? "Update Budget"
                        : "Create Budget"}

            </button>

        </form>

    );

}