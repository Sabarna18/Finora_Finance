// ======================================================
// src/pages/CategoriesPage.tsx
// ======================================================

import {
  useMemo,
  useState,
} from "react";

import {
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";


// import CategoryForm from
//   "@/features/categories/components/CategoryForm";

// import CategoryFilters from
//   "@/features/categories/components/CategoryFilters";

// import type {
//   Category,
// } from "@/types/api";

// import {
//   TransactionType,
// } from "@/types/api";

import Modal from "../components/ui/CategoryModal";
import CategoryForm from "../components/ui/CategoriesForm";
import CategoryFilters from "../components/ui/CategoryFilters";

import type { Category } from "../types/api";

import { TransactionType } from "../api/transactions.api";



// ======================================================
// PAGE
// ======================================================
export default function CategoriesPage() {

  const [filter, setFilter] =
    useState<
      TransactionType | "all"
    >("all");


  const [
    editingCategory,
    setEditingCategory,
  ] =
    useState<
      Category | undefined
    >();


  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);


  // ====================================================
  // QUERIES
  // ====================================================
  const {
    data,
    isLoading,
  } = useCategories(
    filter === "all"
      ? undefined
      : filter
  );


  const createMutation =
    useCreateCategory();

  const updateMutation =
    useUpdateCategory();

  const deleteMutation =
    useDeleteCategory();


  // ====================================================
  // DATA
  // ====================================================
  const categories =
    useMemo(
      () => data || [],
      [data]
    );


  // ====================================================
  // CREATE / UPDATE
  // ====================================================
  function handleSubmit(
    payload: {
      name: string;
      type: TransactionType;
    }
  ) {

    if (editingCategory) {

      updateMutation.mutate(
        {
          categoryId:
            editingCategory.id,

          payload,
        },
        {
          onSuccess: () => {

            setModalOpen(
              false
            );

            setEditingCategory(
              undefined
            );

          },
        }
      );

      return;

    }


    createMutation.mutate(
      payload,
      {
        onSuccess: () => {

          setModalOpen(
            false
          );

        },
      }
    );

  }


  // ====================================================
  // DELETE
  // ====================================================
  function handleDelete(
    categoryId: number
  ) {

    const confirmed =
      window.confirm(
        "Delete this category?"
      );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(
      categoryId
    );

  }


  // ====================================================
  // OPEN CREATE MODAL
  // ====================================================
  function openCreateModal() {

    setEditingCategory(
      undefined
    );

    setModalOpen(
      true
    );

  }


  // ====================================================
  // OPEN EDIT MODAL
  // ====================================================
  function openEditModal(
    category: Category
  ) {

    setEditingCategory(
      category
    );

    setModalOpen(
      true
    );

  }
  // Replace the return block in CategoriesPage.tsx
  // The class names below use your existing Tailwind config

  return (
    <>
      <div className="space-y-6">

        {/* HEADER */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-medium text-zinc-100">Categories</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage income and expense categories for transaction tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CategoryFilters value={filter} onChange={setFilter} />
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <FolderPlus size={15} />
              Add category
            </button>
          </div>
        </section>

        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: categories.length, color: "" },
            { label: "Income", value: categories.filter(c => c.type === TransactionType.INCOME).length, color: "text-emerald-400" },
            { label: "Expense", value: categories.filter(c => c.type === TransactionType.EXPENSE).length, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-zinc-900 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">{label}</p>
              <p className={`mt-1 font-mono text-xl font-medium ${color || "text-zinc-100"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-16">
            <p className="text-sm text-zinc-500">Loading categories…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_120px_80px] border-b border-zinc-800 bg-zinc-900 px-4 py-2">
              {["Name", "Type", ""].map((h, i) => (
                <span key={i} className={`text-[11px] font-medium uppercase tracking-widest text-zinc-500 ${i === 2 ? "text-right" : ""}`}>
                  {h}
                </span>
              ))}
            </div>

            {categories.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-500">
                No categories yet. Add one to get started.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className={`grid grid-cols-[1fr_120px_80px] items-center border-b border-zinc-800/60 px-4 py-3 last:border-none hover:bg-zinc-900/60 transition-colors border-l-2 ${category.type === TransactionType.INCOME
                      ? "border-l-emerald-500"
                      : "border-l-red-500"
                    }`}
                >
                  <span className="text-sm font-medium text-zinc-100">{category.name}</span>

                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${category.type === TransactionType.INCOME
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                    }`}>
                    {category.type}
                  </span>

                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEditModal(category)}
                      title="Edit"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingCategory ? "Edit Category" : "New Category"}
        onClose={() => { setModalOpen(false); setEditingCategory(undefined); }}
      >
        <CategoryForm
          initialData={editingCategory}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>
    </>
  );

}