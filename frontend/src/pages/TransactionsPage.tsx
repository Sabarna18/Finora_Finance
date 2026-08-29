// ======================================================
// src/pages/TransactionsPage.tsx
// ======================================================

import {
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import TransactionTable from "../components/cards/TransactionTable";
import TransactionModal from "../components/ui/TransactionModal";
import TransactionStats from "../components/ui/TransactionsStats";
import TransactionFilters from "../components/ui/TransactionFilters";

import { useCategories } from "../hooks/useCategories";



import {
  TransactionCreate,
  TransactionListParams,
  TransactionResponse,
} from "../api/transactions.api";

import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../hooks/useTransactions";




// ======================================================
// COMPONENT
// ======================================================
export default function TransactionsPage() {

  // ==================================================
  // FILTERS
  // ==================================================
  const [
    filters,
    setFilters,
  ] = useState<TransactionListParams>({
    page: 1,
    limit: 20,
    sort: "-date",
  });


  // ==================================================
  // MODAL
  // ==================================================
  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);


  const [
    editingTransaction,
    setEditingTransaction,
  ] = useState<
    TransactionResponse | null
  >(null);


  // ==================================================
  // DATA
  // ==================================================
  const {

    transactions,

    loading,

    error,

    refetch,

  } = useTransactions(
    filters
  );


  const {

    data: categories = [],

  } = useCategories();


  // ==================================================
  // MUTATIONS
  // ==================================================
  const createMutation =
    useCreateTransaction();

  const updateMutation =
    useUpdateTransaction();

  const deleteMutation =
    useDeleteTransaction();


  // ==================================================
  // CREATE / UPDATE
  // ==================================================
  async function handleSubmit(
    payload: TransactionCreate
  ) {

    try {

      if (
        editingTransaction
      ) {

        await updateMutation
          .mutateAsync({

            transactionId:
              editingTransaction.id,

            payload,

          });

      } else {

        await createMutation
          .mutateAsync(
            payload
          );

      }

      setModalOpen(false);

      setEditingTransaction(
        null
      );

      await refetch();

    } catch (
    error
    ) {

      console.error(
        error
      );

    }

  }


  // ==================================================
  // EDIT
  // ==================================================
  function handleEdit(
    transaction:
      TransactionResponse
  ) {

    setEditingTransaction(
      transaction
    );

    setModalOpen(
      true
    );

  }


  // ==================================================
  // DELETE
  // ==================================================
  async function handleDelete(
    transactionId: number
  ) {

    const confirmed =
      window.confirm(
        "Delete this transaction?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {

      await deleteMutation
        .mutateAsync(
          transactionId
        );

      await refetch();

    } catch (
    error
    ) {

      console.error(
        error
      );

    }

  }


  // ==================================================
  // ADD
  // ==================================================
  function handleAddTransaction() {

    setEditingTransaction(
      null
    );

    setModalOpen(
      true
    );

  }


  // ==================================================
  // LOADING
  // ==================================================
  if (
    loading
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
                        h-10
                        w-10

                        rounded-full

                        border-2
                        border-zinc-700
                        border-t-violet-500

                        animate-spin
                    "
        />

      </div>

    );

  }


  // ==================================================
  // ERROR
  // ==================================================
  if (
    error
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
                        text-red-400
                    "
        >
          Failed to load
          transactions.
        </p>

      </div>

    );

  }


  // ==================================================
  // PAGE
  // ==================================================
  return (

    <div
      className="
                space-y-6
            "
    >

      {/* ======================================
                HERO
            ====================================== */}
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
                            text-3xl
                            font-bold

                            text-white
                        "
          >
            Transactions
          </h1>

          <p
            className="
                            mt-2

                            text-zinc-500
                        "
          >
            Track, manage and
            review your income
            and expenses.
          </p>

        </div>


        <button

          onClick={
            handleAddTransaction
          }

          className="
                        inline-flex
                        items-center
                        gap-2

                        rounded-xl

                        bg-white

                        px-5
                        py-3

                        font-semibold
                        text-black

                        transition-opacity

                        hover:opacity-90
                    "
        >

          <Plus
            size={18}
          />

          Add Transaction

        </button>

      </div>


      {/* ======================================
                FILTERS
            ====================================== */}
      <TransactionFilters

        filters={
          filters
        }

        onApply={
          setFilters
        }

        onReset={() =>

          setFilters({

            page: 1,

            limit: 20,

            sort: "-date",

          })

        }

      />


      {/* ======================================
                STATS
            ====================================== */}
      <TransactionStats

        transactions={
          transactions
        }

      />


      {/* ======================================
                TABLE
            ====================================== */}
      <div
        className="
                    overflow-hidden

                    rounded-3xl

                    border
                    border-zinc-800

                    bg-zinc-950
                "
      >

        <TransactionTable

          transactions={
            transactions
          }

          categories={
            categories
          }

          onEdit={
            handleEdit
          }

          onDelete={
            handleDelete
          }

        />

      </div>


      {/* ======================================
                MODAL
            ====================================== */}
      <TransactionModal

        open={
          modalOpen
        }

        transaction={
          editingTransaction
        }

        categories={
          categories
        }

        loading={

          createMutation
            .isPending ||

          updateMutation
            .isPending

        }

        onClose={() => {

          setModalOpen(
            false
          );

          setEditingTransaction(
            null
          );

        }}

        onSubmit={
          handleSubmit
        }

      />

    </div>

  );

}