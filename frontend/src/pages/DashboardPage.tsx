import {
  useState,
} from "react";

import DashboardHero
from "../components/cards/DashboardHero";

import SummaryGrid
from "../components/cards/SummaryGrid";

import RecentTransactionsCard
from "../components/cards/RecentTransactionsCard";

import DashboardFilters
from "../components/ui/DashboardFilters";

import {
  useDashboardSummary,
} from "../hooks/useDashboardSummary";

import {
  useRecentTransactions,
} from "../hooks/useRecentTransactions";


// ======================================================
// COMPONENT
// ======================================================
export default function DashboardPage() {

  // ====================================================
  // FILTER STATE
  // ====================================================
  const now =
    new Date();

  const [month, setMonth] =
    useState(
      now.getMonth() + 1
    );

  const [year, setYear] =
    useState(
      now.getFullYear()
    );

  const [
    transactionLimit,
    setTransactionLimit,
  ] = useState(5);


  // ====================================================
  // SUMMARY QUERY
  // ====================================================
const {
  data: summary,
  isLoading: summaryLoading,
  isError: summaryError,
} = useDashboardSummary({
  month,
  year,
});

  // ====================================================
  // RECENT TRANSACTIONS QUERY
  // ====================================================
const {
  data: transactions,
  isLoading: transactionsLoading,
  isError: transactionsError,
} = useRecentTransactions(
  transactionLimit
);


  // ====================================================
  // LOADING
  // ====================================================
  if (
    summaryLoading ||
    transactionsLoading
  ) {

    return (

      <div
        className="
          flex
          items-center
          justify-center
          py-24
        "
      >

        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >

          <div
            className="
              h-10
              w-10

              rounded-full

              border-2
              border-zinc-700
              border-t-violet-500

              animate-spin
            "
          />

          <p
            className="
              text-sm
              text-zinc-500
            "
          >
            Loading dashboard...
          </p>

        </div>

      </div>

    );

  }


  // ====================================================
  // ERROR
  // ====================================================
  if (
    summaryError ||
    transactionsError ||
    !summary ||
    !transactions
  ) {

    return (

      <div
        className="
          rounded-3xl

          border
          border-red-900/30

          bg-red-950/20

          p-6
        "
      >

        <p
          className="
            text-sm
            text-red-400
          "
        >
          Failed to load dashboard data.
        </p>

      </div>

    );

  }


  // ====================================================
  // PAGE
  // ====================================================
  return (

    <div
      className="
        space-y-8
      "
    >

      {/* HERO */}
      <DashboardHero />


      {/* FILTERS */}
      <DashboardFilters

        month={month}

        year={year}

        transactionLimit={
          transactionLimit
        }

        onMonthChange={
          setMonth
        }

        onYearChange={
          setYear
        }

        onTransactionLimitChange={
          setTransactionLimit
        }

      />


      {/* SUMMARY */}
      <SummaryGrid
        summary={summary}
      />


      {/* RECENT TRANSACTIONS */}
      <RecentTransactionsCard
        transactions={
          transactions.data
        }
      />

    </div>

  );

}