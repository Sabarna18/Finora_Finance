// ======================================================
// src/components/ui/TransactionModal.tsx
// ======================================================



import TransactionForm from "../forms/TransactionForm";

import {
    TransactionCreate,
    TransactionResponse,
} from "../../api/transactions.api";

import {
    CategoryResponse,
} from "../../types/api";


interface Props {

    open: boolean;

    loading: boolean;

    transaction:
    TransactionResponse | null;

    categories:
    CategoryResponse[];

    onClose: () => void;

    onSubmit: (
        payload: TransactionCreate
    ) => void;

}


export default function TransactionModal({

    open,

    loading,

    transaction,

    categories,

    onClose,

    onSubmit,

}: Props) {

    if (!open) {
        return null;
    }

    return (

        <div
            className="
        fixed
        inset-0
        z-50

        flex
        items-center
        justify-center

        bg-black/70
        backdrop-blur-sm
      "
        >

            <div
                className="
          w-full
          max-w-xl

          rounded-3xl

          border
          border-zinc-800

          bg-zinc-950

          p-6
        "
            >

                <div
                    className="
            mb-6

            flex
            items-center
            justify-between
          "
                >

                    <h2
                        className="
              text-xl
              font-semibold
              text-white
            "
                    >

                        {transaction
                            ? "Edit Transaction"
                            : "Add Transaction"}

                    </h2>

                    <button

                        onClick={onClose}

                        className="
              text-zinc-400

              transition-colors

              hover:text-white
            "
                    >
                        ✕
                    </button>

                </div>


                <TransactionForm

                    transaction={
                        transaction
                    }

                    categories={
                        categories
                    }

                    loading={
                        loading
                    }

                    onSubmit={
                        onSubmit
                    }

                />

            </div>

        </div>

    );

}