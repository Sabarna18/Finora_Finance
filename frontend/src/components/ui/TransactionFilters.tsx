// ======================================================
// src/components/filters/TransactionFilters.tsx
// ======================================================

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Filter,
    Search,
} from "lucide-react";

import {
    TransactionListParams,
    TransactionType,
} from "../../api/transactions.api";


// ======================================================
// MONTHS
// ======================================================
const MONTHS = [

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
// PROPS
// ======================================================
interface Props {

    filters:
    TransactionListParams;

    onApply: (
        filters:
            TransactionListParams
    ) => void;

    onReset: () => void;

}


// ======================================================
// COMPONENT
// ======================================================
export default function TransactionFilters({

    filters,

    onApply,

    onReset,

}: Props) {

    // ==================================================
    // DRAFT FILTERS
    // ==================================================
    const [
        draftFilters,
        setDraftFilters,
    ] = useState(filters);


    // ==================================================
    // YEARS
    // ==================================================
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


    // ==================================================
    // SYNC
    // ==================================================
    useEffect(() => {

        setDraftFilters(
            filters
        );

    }, [filters]);


    // ==================================================
    // UPDATE FILTER
    // ==================================================
    function updateFilter(
        key: keyof TransactionListParams,
        value: unknown
    ) {

        setDraftFilters(

            (prev) => ({

                ...prev,

                [key]:

                    value === ""
                        ? undefined
                        : value,

            })

        );

    }


    // ==================================================
    // APPLY
    // ==================================================
    function handleApply() {

        onApply({

            ...draftFilters,

            page: 1,

        });

    }


    // ==================================================
    // RESET
    // ==================================================
    function handleReset() {

        const resetFilters:
            TransactionListParams = {

            page: 1,

            limit: 20,

            sort: "-date",

        };

        setDraftFilters(
            resetFilters
        );

        onReset();

    }


    // ==================================================
    // UI
    // ==================================================
    return (

        <div
            className="
                rounded-3xl

                border
                border-zinc-800

                bg-zinc-950

                p-5
            "
        >

            {/* ======================================
                HEADER
            ====================================== */}
            <div
                className="
                    mb-6

                    flex
                    items-center
                    gap-2
                "
            >

                <Filter
                    size={18}
                    className="
                        text-violet-400
                    "
                />

                <h3
                    className="
                        text-sm
                        font-semibold

                        text-white
                    "
                >
                    Transaction Filters
                </h3>

            </div>


            {/* ======================================
                FILTER GRID
            ====================================== */}
            <div
                className="
                    grid
                    gap-4

                    md:grid-cols-2

                    xl:grid-cols-5
                "
            >

                {/* SEARCH */}
                <div
                    className="
                        xl:col-span-2
                    "
                >

                    <label
                        className="
                            mb-2
                            block

                            text-xs
                            font-medium

                            text-zinc-400
                        "
                    >
                        Search
                    </label>

                    <div
                        className="
                            relative
                        "
                    >

                        <Search
                            size={16}
                            className="
                                absolute

                                left-3
                                top-1/2

                                -translate-y-1/2

                                text-zinc-500
                            "
                        />

                        <input

                            type="text"

                            placeholder="
                                Search description...
                            "

                            value={
                                draftFilters.search
                                ?? ""
                            }

                            onChange={(e) =>
                                updateFilter(
                                    "search",
                                    e.target.value
                                )
                            }

                            className="
                                w-full

                                rounded-xl

                                border
                                border-zinc-700

                                bg-zinc-900

                                py-2.5
                                pl-10
                                pr-4

                                text-sm
                                text-white

                                outline-none

                                focus:border-violet-500
                            "
                        />

                    </div>

                </div>


                {/* TYPE */}
                <div>

                    <label
                        className="
                            mb-2
                            block

                            text-xs
                            font-medium

                            text-zinc-400
                        "
                    >
                        Type
                    </label>

                    <select

                        value={
                            draftFilters.type
                            ?? ""
                        }

                        onChange={(e) =>
                            updateFilter(
                                "type",
                                e.target.value
                            )
                        }

                        className="
                            w-full

                            rounded-xl

                            border
                            border-zinc-700

                            bg-zinc-900

                            px-3
                            py-2.5

                            text-sm
                            text-white

                            outline-none

                            focus:border-violet-500
                        "
                    >

                        <option value="">
                            All Types
                        </option>

                        <option
                            value={
                                TransactionType.INCOME
                            }
                        >
                            Income
                        </option>

                        <option
                            value={
                                TransactionType.EXPENSE
                            }
                        >
                            Expense
                        </option>

                    </select>

                </div>


                {/* MONTH */}
                <div>

                    <label
                        className="
                            mb-2
                            block

                            text-xs
                            font-medium

                            text-zinc-400
                        "
                    >
                        Month
                    </label>

                    <select

                        value={
                            draftFilters.month
                            ?? ""
                        }

                        onChange={(e) =>
                            updateFilter(

                                "month",

                                e.target.value
                                    ? Number(
                                        e.target.value
                                    )
                                    : ""

                            )
                        }

                        className="
                            w-full

                            rounded-xl

                            border
                            border-zinc-700

                            bg-zinc-900

                            px-3
                            py-2.5

                            text-sm
                            text-white

                            outline-none

                            focus:border-violet-500
                        "
                    >

                        <option value="">
                            All Months
                        </option>

                        {MONTHS.map(
                            (month) => (

                                <option

                                    key={
                                        month.value
                                    }

                                    value={
                                        month.value
                                    }

                                >
                                    {month.label}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* YEAR */}
                <div>

                    <label
                        className="
                            mb-2
                            block

                            text-xs
                            font-medium

                            text-zinc-400
                        "
                    >
                        Year
                    </label>

                    <select

                        value={
                            draftFilters.year
                            ?? ""
                        }

                        onChange={(e) =>
                            updateFilter(

                                "year",

                                e.target.value
                                    ? Number(
                                        e.target.value
                                    )
                                    : ""

                            )
                        }

                        className="
                            w-full

                            rounded-xl

                            border
                            border-zinc-700

                            bg-zinc-900

                            px-3
                            py-2.5

                            text-sm
                            text-white

                            outline-none

                            focus:border-violet-500
                        "
                    >

                        <option value="">
                            All Years
                        </option>

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


                {/* WEEK */}
                <div>

                    <label
                        className="
                            mb-2
                            block

                            text-xs
                            font-medium

                            text-zinc-400
                        "
                    >
                        Week
                    </label>

                    <select

                        value={
                            draftFilters.week
                            ?? ""
                        }

                        onChange={(e) =>
                            updateFilter(

                                "week",

                                e.target.value
                                    ? Number(
                                        e.target.value
                                    )
                                    : ""

                            )
                        }

                        className="
                            w-full

                            rounded-xl

                            border
                            border-zinc-700

                            bg-zinc-900

                            px-3
                            py-2.5

                            text-sm
                            text-white

                            outline-none

                            focus:border-violet-500
                        "
                    >

                        <option value="">
                            All Weeks
                        </option>

                        <option value={1}>
                            Week 1
                        </option>

                        <option value={2}>
                            Week 2
                        </option>

                        <option value={3}>
                            Week 3
                        </option>

                        <option value={4}>
                            Week 4
                        </option>

                    </select>

                </div>

            </div>


            {/* ======================================
                ACTIONS
            ====================================== */}
            <div
                className="
                    mt-6

                    flex
                    justify-end

                    gap-3
                "
            >

                <button

                    onClick={
                        handleReset
                    }

                    className="
                        rounded-xl

                        border
                        border-zinc-700

                        px-4
                        py-2

                        text-sm

                        text-zinc-300

                        transition-all

                        hover:border-zinc-500
                        hover:text-white
                    "
                >
                    Reset
                </button>


                <button

                    onClick={
                        handleApply
                    }

                    className="
                        rounded-xl

                        bg-violet-600

                        px-5
                        py-2

                        text-sm
                        font-medium

                        text-white

                        transition-all

                        hover:bg-violet-500
                    "
                >
                    Apply Filters
                </button>

            </div>

        </div>

    );

}