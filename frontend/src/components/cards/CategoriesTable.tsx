// ======================================================
// src/features/categories/components/CategoriesTable.tsx
// ======================================================

import type { Category } from "../../types/api";

interface CategoriesTableProps {
    categories: Category[];
    onEdit: (category: Category) => void;
    onDelete: (categoryId: number) => void;
}

export default function CategoriesTable({
    categories,
    onEdit,
    onDelete,
}: CategoriesTableProps) {
    if (categories.length === 0) {
        return (
            <div
                className="
                    rounded-2xl
                    border border-white/10
                    bg-white/5
                    backdrop-blur-sm
                    p-12
                    text-center
                    text-sm
                    text-white/40
                    tracking-wide
                "
            >
                No categories found
            </div>
        );
    }

    return (
        <div
            className="
                overflow-hidden
                rounded-2xl
                border border-white/10
                bg-white/5
                backdrop-blur-sm
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            "
        >
            <table className="w-full border-collapse">
                <thead>
                    <tr
                        className="
                            border-b border-white/10
                            bg-white/[0.06]
                        "
                    >
                        <th
                            className="
                                px-6 py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-widest
                                text-white/50
                            "
                        >
                            Name
                        </th>

                        <th
                            className="
                                px-6 py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-widest
                                text-white/50
                            "
                        >
                            Type
                        </th>

                        <th
                            className="
                                px-6 py-4
                                text-right
                                text-xs
                                font-semibold
                                uppercase
                                tracking-widest
                                text-white/50
                            "
                        >
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {categories.map((category) => (
                        <tr
                            key={category.id}
                            className="
                                border-b border-white/[0.06]
                                last:border-0
                                transition-colors duration-150
                                hover:bg-white/[0.04]
                            "
                        >
                            <td
                                className="
                                    px-6 py-4
                                    text-sm
                                    font-medium
                                    text-white/90
                                "
                            >
                                {category.name}
                            </td>

                            <td className="px-6 py-4">
                                <span
                                    className={`
                                        inline-flex items-center
                                        rounded-full
                                        px-3 py-1
                                        text-xs font-semibold
                                        tracking-wide
                                        ring-1

                                        ${category.type === "income"
                                            ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                                            : "bg-rose-500/15 text-rose-300 ring-rose-500/30"
                                        }
                                    `}
                                >
                                    {category.type}
                                </span>
                            </td>

                            <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(category)}
                                        className="
                                            rounded-lg
                                            border border-white/15
                                            bg-white/5
                                            px-3 py-1.5
                                            text-xs font-medium
                                            text-white/70
                                            transition-all duration-150
                                            hover:border-white/30
                                            hover:bg-white/10
                                            hover:text-white
                                        "
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => onDelete(category.id)}
                                        className="
                                            rounded-lg
                                            border border-rose-500/25
                                            bg-rose-500/10
                                            px-3 py-1.5
                                            text-xs font-medium
                                            text-rose-400
                                            transition-all duration-150
                                            hover:border-rose-400/50
                                            hover:bg-rose-500/20
                                            hover:text-rose-300
                                        "
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}