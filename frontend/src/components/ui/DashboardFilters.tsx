// ======================================================
// src/features/dashboard/components/DashboardFilters.tsx
// ======================================================

interface DashboardFiltersProps {

  month: number;

  year: number;

  transactionLimit: number;


  onMonthChange: (
    value: number
  ) => void;


  onYearChange: (
    value: number
  ) => void;


  onTransactionLimitChange: (
    value: number
  ) => void;

}


// ======================================================
// CONSTANTS
// ======================================================
const months = [

  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },

];


// ======================================================
// COMPONENT
// ======================================================
export default function DashboardFilters({

  month,

  year,

  transactionLimit,

  onMonthChange,

  onYearChange,

  onTransactionLimitChange,

}: DashboardFiltersProps) {

  // ====================================================
  // YEARS
  // ====================================================
  const currentYear =
    new Date().getFullYear();

  const years =
    Array.from(
      { length: 6 },
      (_, index) =>
        currentYear - index
    );


  return (

    <section
      className="
        flex
        flex-col
        gap-4

        rounded-3xl

        border
        border-zinc-800/60

        bg-zinc-950

        p-5

        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >

      {/* ==================================================
          LEFT
      ================================================== */}
      <div>

        <h2
          className="
            text-sm
            font-semibold
            text-zinc-100
          "
        >
          Dashboard Filters
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-zinc-500
          "
        >
          Filter financial insights by month and year.
        </p>

      </div>


      {/* ==================================================
          FILTERS
      ================================================== */}
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >

        {/* MONTH */}
        <div
          className="
            flex
            flex-col
            gap-1
          "
        >

          <label
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-zinc-500
            "
          >
            Month
          </label>

          <select

            value={month}

            onChange={(e) =>
              onMonthChange(
                Number(
                  e.target.value
                )
              )
            }

            className="
              h-11
              min-w-[160px]

              rounded-xl

              border
              border-zinc-800/60

              bg-zinc-900

              px-4

              text-sm
              text-zinc-100

              outline-none

              transition-colors

              focus:border-violet-500/60
            "
          >

            {months.map((item) => (

              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>

            ))}

          </select>

        </div>


        {/* YEAR */}
        <div
          className="
            flex
            flex-col
            gap-1
          "
        >

          <label
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-zinc-500
            "
          >
            Year
          </label>

          <select

            value={year}

            onChange={(e) =>
              onYearChange(
                Number(
                  e.target.value
                )
              )
            }

            className="
              h-11
              min-w-[120px]

              rounded-xl

              border
              border-zinc-800/60

              bg-zinc-900

              px-4

              text-sm
              text-zinc-100

              outline-none

              transition-colors

              focus:border-violet-500/60
            "
          >

            {years.map((item) => (

              <option
                key={item}
                value={item}
              >
                {item}
              </option>

            ))}

          </select>

        </div>


        {/* TRANSACTION LIMIT */}
        <div
          className="
            flex
            flex-col
            gap-1
          "
        >

          <label
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-zinc-500
            "
          >
            Transactions
          </label>

          <select

            value={transactionLimit}

            onChange={(e) =>
              onTransactionLimitChange(
                Number(
                  e.target.value
                )
              )
            }

            className="
              h-11
              min-w-[120px]

              rounded-xl

              border
              border-zinc-800/60

              bg-zinc-900

              px-4

              text-sm
              text-zinc-100

              outline-none

              transition-colors

              focus:border-violet-500/60
            "
          >

            <option value={5}>
              Last 5
            </option>

            <option value={10}>
              Last 10
            </option>

            <option value={20}>
              Last 20
            </option>

          </select>

        </div>

      </div>

    </section>

  );

}