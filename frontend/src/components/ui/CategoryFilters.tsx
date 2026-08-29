// ======================================================
// src/features/categories/components/CategoryFilters.tsx
// ======================================================

import {
    TransactionType,
} from "../../types/api";


interface CategoryFiltersProps {

    value:
    | TransactionType
    | "all";

    onChange: (
        value:
            | TransactionType
            | "all"
    ) => void;

}


export default function CategoryFilters({

    value,

    onChange,

}: CategoryFiltersProps) {

    return (

        <div
            className="
        flex
        items-center
        gap-3
      "
        >

            <button

                onClick={() =>
                    onChange("all")
                }

                className={`
          rounded-xl
          border
          px-4
          py-2
          text-sm
          transition-colors

          ${value === "all"
                        ? "bg-black text-white"
                        : "bg-white"
                    }
        `}
            >
                All
            </button>


            <button

                onClick={() =>
                    onChange(
                        TransactionType.INCOME
                    )
                }

                className={`
          rounded-xl
          border
          px-4
          py-2
          text-sm
          transition-colors

          ${value
                        === TransactionType.INCOME
                        ? "bg-green-600 text-white"
                        : "bg-white"
                    }
        `}
            >
                Income
            </button>


            <button

                onClick={() =>
                    onChange(
                        TransactionType.EXPENSE
                    )
                }

                className={`
          rounded-xl
          border
          px-4
          py-2
          text-sm
          transition-colors

          ${value
                        === TransactionType.EXPENSE
                        ? "bg-red-600 text-white"
                        : "bg-white"
                    }
        `}
            >
                Expense
            </button>

        </div>

    );

}