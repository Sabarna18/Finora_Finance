// ======================================================
// src/features/transactions/components/TransactionForm.tsx
// ======================================================

import {
  useEffect,
  useState,
} from "react";

import {
  TransactionCreate,
  TransactionResponse,
  TransactionType,
} from "../../api/transactions.api";

// import {
//   CategoryResponse,
// } from "../../api/";

import { CategoryResponse } from "../../types/api";

interface Props {

  transaction?:
    TransactionResponse | null;

  categories:
    CategoryResponse[];

  loading: boolean;

  onSubmit: (
    payload: TransactionCreate
  ) => void;

}


export default function TransactionForm({

  transaction,

  categories,

  loading,

  onSubmit,

}: Props) {

  // ====================================================
  // FORM STATE
  // ====================================================
  const [
    amount,
    setAmount,
  ] = useState(0);


  const [
    type,
    setType,
  ] = useState<TransactionType>(
    TransactionType.EXPENSE
  );


  const [
    description,
    setDescription,
  ] = useState("");


  const [
    categoryId,
    setCategoryId,
  ] = useState<number | null>(
    null
  );


  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );


  const [
    error,
    setError,
  ] = useState("");


  // ====================================================
  // LOAD EXISTING TRANSACTION
  // ====================================================
  useEffect(() => {

    if (!transaction) {
      return;
    }

    setAmount(
      transaction.amount
    );

    setType(
      transaction.type
    );

    setDescription(
      transaction.description || ""
    );

    setCategoryId(
      transaction.category_id ?? null
    );

    setTransactionDate(
      transaction.date
        ? transaction.date.split("T")[0]
        : new Date()
            .toISOString()
            .split("T")[0]
    );

  }, [transaction]);


  // ====================================================
  // VALIDATION
  // ====================================================
  const isFormValid =

    amount > 0 &&

    categoryId !== null &&

    description.trim()
      .length >= 3 &&

    transactionDate.length > 0;


  // ====================================================
  // SUBMIT
  // ====================================================
  function handleSubmit(
    event: React.FormEvent
  ) {

    event.preventDefault();

    setError("");

    // ----------------------------
    // Amount
    // ----------------------------
    if (amount <= 0) {

      setError(
        "Amount must be greater than 0."
      );

      return;

    }

    // ----------------------------
    // Category
    // ----------------------------
    if (
      categoryId === null
    ) {

      setError(
        "Please select a category."
      );

      return;

    }

    // ----------------------------
    // Date
    // ----------------------------
    if (
      !transactionDate
    ) {

      setError(
        "Please select a transaction date."
      );

      return;

    }

    // ----------------------------
    // Description
    // ----------------------------
    if (
      description.trim()
        .length < 3
    ) {

      setError(
        "Description must be at least 3 characters."
      );

      return;

    }

    // ----------------------------
    // Submit
    // ----------------------------
    onSubmit({

      amount,

      type,

      date:
        transactionDate,

      description:
        description.trim(),

      category_id:
        categoryId,

    });

  }


  // ====================================================
  // UI
  // ====================================================
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
          ERROR
      ====================================== */}
      {error && (

        <div
          className="
            rounded-xl

            border
            border-red-900/50

            bg-red-950/30

            px-4
            py-3

            text-sm
            text-red-400
          "
        >
          {error}
        </div>

      )}


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
          Amount
        </label>

        <input

          type="number"

          min={0}

          step="1.00"

          value={
            amount || ""
          }

          onChange={(e) =>
            setAmount(
              Number(
                e.target.value
              )
            )
          }

          placeholder="Enter amount"

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
        />

      </div>


      {/* ======================================
          TYPE
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
          Transaction Type
        </label>

        <select

          value={type}

          onChange={(e) =>
            setType(
              e.target.value as
              TransactionType
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
          Category
        </label>

        <select

          value={
            categoryId ?? ""
          }

          onChange={(e) =>
            setCategoryId(
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

          <option value="">
            Select Category
          </option>

          {categories.map(
            (category) => (

              <option

                key={
                  category.id
                }

                value={
                  category.id
                }

              >

                {category.name}

              </option>

            )
          )}

        </select>

      </div>


      {/* ======================================
          DATE
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
          Transaction Date
        </label>

        <input

          type="date"

          value={
            transactionDate
          }

          onChange={(e) =>
            setTransactionDate(
              e.target.value
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
        />

      </div>


      {/* ======================================
          DESCRIPTION
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
          Description
        </label>

        <textarea

          rows={4}

          value={
            description
          }

          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }

          placeholder="Enter description"

          className="
            w-full

            resize-none

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
        />

      </div>


      {/* ======================================
          SUBMIT
      ====================================== */}
      <button

        type="submit"

        disabled={
          loading ||
          !isFormValid
        }

        className="
          w-full

          rounded-xl

          bg-white

          px-4
          py-3

          font-semibold
          text-black

          transition-opacity

          hover:opacity-90

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >

        {loading

          ? "Saving..."

          : transaction

            ? "Update Transaction"

            : "Create Transaction"}

      </button>

    </form>

  );

}