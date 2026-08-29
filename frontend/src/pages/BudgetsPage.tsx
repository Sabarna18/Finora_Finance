// ======================================================
// src/pages/BudgetsPage.tsx
// ======================================================

import {
  useState,
} from "react";

import type {
  Budget,
} from "../types/api";

import BudgetForm from "../components/forms/BudgetForm";
import BudgetFilters from "../components/ui/BudgetFilters";
import BudgetsTable from "../components/cards/BudgetsTable";

import {
  useCategories,
} from "../hooks/useCategories";

import {
  useBudgetStatuses,
} from "../hooks/useBudgetStatus";

import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "../hooks/useBudgets";


export default function BudgetsPage() {

  // ====================================================
  // DEFAULT MONTH / YEAR
  // ====================================================
  const today =
    new Date();

  const [
    month,
    setMonth,
  ] = useState<number>(
    today.getMonth() + 1
  );

  const [
    year,
    setYear,
  ] = useState<number>(
    today.getFullYear()
  );

  const [
    editingBudget,
    setEditingBudget,
  ] = useState<
    Budget | undefined
  >();

  // ====================================================
  // BUDGETS
  // ====================================================
  const {

    data: budgets = [],

    isLoading:
    budgetsLoading,

  } = useBudgets({

    month,

    year,

  });

  // ====================================================
  // BUDGET STATUSES
  // ====================================================
  const {

    data: statuses = [],

    isLoading:
    statusesLoading,

  } = useBudgetStatuses(

    month,

    year,

  );

  // ====================================================
  // CATEGORIES
  // ====================================================
  const {

    data: categories = [],

  } = useCategories();

  // ====================================================
  // MUTATIONS
  // ====================================================
  const createMutation =
    useCreateBudget();

  const updateMutation =
    useUpdateBudget();

  const deleteMutation =
    useDeleteBudget();

  // ====================================================
  // CREATE / UPDATE
  // ====================================================
  function handleSubmit(
    payload: any
  ) {

    if (
      editingBudget
    ) {

      updateMutation.mutate({

        budgetId:
          editingBudget.id,

        payload,

      });

      setEditingBudget(
        undefined
      );

      return;

    }

    createMutation.mutate(
      payload
    );

  }

  // ====================================================
  // DELETE
  // ====================================================
  function handleDelete(
    budgetId: number
  ) {

    const confirmed =
      window.confirm(
        "Delete this budget?"
      );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(
      budgetId
    );

  }

  const isLoading =
    budgetsLoading ||
    statusesLoading;

  // ====================================================
  // UI
  // ====================================================
  return (

    <div
      className="
        space-y-6
      "
    >

      {/* =========================================
          PAGE HEADER
      ========================================= */}
      <div
        className="
          flex
          flex-col
          gap-4

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold
            "
          >
            Budgets
          </h1>

          <p
            className="
              text-sm
              text-zinc-500
            "
          >
            Create, monitor and manage
            monthly spending budgets.
          </p>

        </div>

        <BudgetFilters

          month={month}

          year={year}

          onMonthChange={
            (value) =>
              setMonth(
                value ??
                (
                  today.getMonth() + 1
                )
              )
          }

          onYearChange={
            (value) =>
              setYear(
                value ??
                today.getFullYear()
              )
          }

        />

      </div>

      {/* =========================================
          CONTENT
      ========================================= */}
      {/* =========================================
    CONTENT
========================================= */}
      <div
        className="
    space-y-6
  "
      >

        {/* ===============================
      TABLE
  =============================== */}
        <div>

          {isLoading ? (

            <div
              className="
          rounded-2xl
          border
          p-8
          text-center
        "
            >
              Loading budgets...
            </div>

          ) : (

            <BudgetsTable

              budgets={
                budgets
              }

              categories={
                categories
              }

              statuses={
                statuses
              }

              onEdit={
                setEditingBudget
              }

              onDelete={
                handleDelete
              }

            />

          )}

        </div>

        {/* ===============================
      FORM
  =============================== */}
        <div
          className="
      rounded-2xl
      border
      p-6
    "
        >

          <div
            className="
        mb-6
      "
          >

            <h2
              className="
          text-lg
          font-semibold
        "
            >

              {editingBudget

                ? "Edit Budget"

                : "Create Budget"}

            </h2>

            <p
              className="
          mt-1
          text-sm
          text-zinc-500
        "
            >

              {editingBudget

                ? "Update an existing budget."

                : "Create a new monthly budget."}

            </p>

          </div>

          <BudgetForm

            budget={
              editingBudget
            }

            loading={
              createMutation.isPending ||
              updateMutation.isPending
            }

            onSubmit={
              handleSubmit
            }

          />

        </div>

      </div>

    </div>

  );

}