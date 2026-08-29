// ======================================================
// src/features/budgets/components/BudgetFilters.tsx
// ======================================================

interface Props {

    month?: number;

    year?: number;

    onMonthChange: (
        value?: number
    ) => void;

    onYearChange: (
        value?: number
    ) => void;

}

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


export default function BudgetFilters({

    month,

    year,

    onMonthChange,

    onYearChange,

}: Props) {

    const currentYear =
        new Date().getFullYear();

    const years =
        Array.from(
            { length: 6 },
            (_, index) =>
                currentYear - index
        );

    return (

        <div
            className="
        flex
        flex-wrap
        gap-4
      "
        >

            <select

                value={month ?? ""}

                onChange={(e) =>
                    onMonthChange(
                        e.target.value
                            ? Number(
                                e.target.value
                            )
                            : undefined
                    )
                }

                className="
          rounded-xl
          border
          px-4
          py-2
        "
            >

                <option value="">
                    All Months
                </option>

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


            <select

                value={year ?? ""}

                onChange={(e) =>
                    onYearChange(
                        e.target.value
                            ? Number(
                                e.target.value
                            )
                            : undefined
                    )
                }

                className="
          rounded-xl
          border
          px-4
          py-2
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

    );

}