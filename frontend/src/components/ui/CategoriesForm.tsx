// ======================================================
// src/features/categories/components/CategoryForm.tsx
// ======================================================

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import type {
    Category,
} from "../../types/api";

import {
    TransactionType,
} from "../../types/api";


interface CategoryFormProps {

    initialData?: Category;

    isLoading?: boolean;

    onSubmit: (
        payload: {
            name: string;
            type: TransactionType;
        }
    ) => void;

}


export default function CategoryForm({

    initialData,

    isLoading,

    onSubmit,

}: CategoryFormProps) {

    const [name, setName] =
        useState("");

    const [type, setType] =
        useState<TransactionType>(
            TransactionType.EXPENSE
        );


    useEffect(() => {

        if (initialData) {

            setName(
                initialData.name
            );

            setType(
                initialData.type
            );

        }

    }, [initialData]);


    function handleSubmit(
        e: FormEvent
    ) {

        e.preventDefault();

        onSubmit({
            name: name.trim(),
            type,
        });

    }


    return (

        <form
            onSubmit={handleSubmit}
            className="
        space-y-4
      "
        >

            {/* NAME */}
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
                            e.target.value
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


            {/* TYPE */}
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
                            e.target
                                .value as TransactionType
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


            {/* SUBMIT */}
            <button

                type="submit"

                disabled={
                    !name.trim()
                    || isLoading
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