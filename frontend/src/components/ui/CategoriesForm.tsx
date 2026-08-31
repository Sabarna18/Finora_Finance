// ======================================================
// src/features/categories/components/CategoryForm.tsx
// ======================================================

import {
    useState,
    type FormEvent,
} from "react";

import {
    TransactionType,
    type Category,
} from "../../types/api";

interface CategoryFormProps {
    initialData?: Category;
    isLoading?: boolean;
    onSubmit: (
        payload: {
            name: string;
            type: TransactionType;
        },
    ) => void;
}

export default function CategoryForm({
    initialData,
    isLoading,
    onSubmit,
}: CategoryFormProps) {
    // ==================================================
    // FORM STATE
    // ==================================================

    const [name, setName] = useState(
        initialData?.name ?? "",
    );

    const [type, setType] =
        useState<TransactionType>(
            initialData?.type ??
            TransactionType.EXPENSE,
        );

    // ==================================================
    // SUBMIT
    // ==================================================

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        onSubmit({
            name: name.trim(),
            type,
        });
    }

    // ==================================================
    // UI
    // ==================================================

    return (
        <form
            onSubmit={handleSubmit}
            className="
                space-y-4
            "
        >
            {/* ==========================================
                NAME
            ========================================== */}

            <div>
                <label
                    className="
                        mb-2
                        block
                        text-sm
                        font-medium
                    "
                >
                    Category Name
                </label>

                <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                        setName(
                            e.target.value,
                        )
                    }
                    placeholder="Food"
                    className="
                        w-full
                        rounded-xl
                        border
                        px-4
                        py-3
                        outline-none
                    "
                    required
                />
            </div>

            {/* ==========================================
                TYPE
            ========================================== */}

            <div>
                <label
                    className="
                        mb-2
                        block
                        text-sm
                        font-medium
                    "
                >
                    Type
                </label>

                <select
                    value={type}
                    onChange={(e) =>
                        setType(
                            e.target.value as
                                TransactionType,
                        )
                    }
                    className="
                        w-full
                        rounded-xl
                        border
                        px-4
                        py-3
                        outline-none
                    "
                >
                    <option
                        value={
                            TransactionType.EXPENSE
                        }
                    >
                        Expense
                    </option>

                    <option
                        value={
                            TransactionType.INCOME
                        }
                    >
                        Income
                    </option>
                </select>
            </div>

            {/* ==========================================
                SUBMIT
            ========================================== */}

            <button
                type="submit"
                disabled={
                    !name.trim() ||
                    isLoading
                }
                className="
                    w-full
                    rounded-xl
                    bg-black
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    disabled:opacity-50
                "
            >
                {isLoading
                    ? "Saving..."
                    : initialData
                      ? "Update Category"
                      : "Create Category"}
            </button>
        </form>
    );
}

