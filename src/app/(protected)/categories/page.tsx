"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategoriesAction } from "@/actions/categories";
import CategoryDialog, { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Tag } from "lucide-react";

export default function CategoriesPage() {
  const { data: list, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 mt-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load categories.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  // Filter into incomes and expenses
  const expenses = list.filter((c) => c.type === "expense");
  const incomes = list.filter((c) => c.type === "income");

  const renderCategoryGrid = (items: typeof list) => (
    <div className="flex flex-col border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800 mt-4">
      {items.map((cat) => {
        // Resolve Icon component
        const IconComponent = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS] || Tag;
        const colorHex = cat.color || "#71717a";

        return (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3 hover:bg-zinc-800/10 transition-colors duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-10 rounded-md flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${colorHex}15`,
                  color: colorHex,
                }}
              >
                <IconComponent className="size-5" />
              </div>
              <span className="text-sm font-semibold truncate text-zinc-50 pr-2">
                {cat.name}
              </span>
            </div>

            <DeleteCategoryButton categoryId={cat.id} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Customize icons and colors for categorizing your flows.</p>
        </div>
        <div>
          <CategoryDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses List */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl">
          <h2 className="text-xs font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800 pb-2.5">
            Expenses (Outflows)
          </h2>
          {expenses.length === 0 ? (
            <p className="text-xs text-zinc-500 mt-4 text-center">No expense categories.</p>
          ) : (
            renderCategoryGrid(expenses)
          )}
        </div>

        {/* Income List */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl">
          <h2 className="text-xs font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800 pb-2.5">
            Incomes (Inflows)
          </h2>
          {incomes.length === 0 ? (
            <p className="text-xs text-zinc-500 mt-4 text-center">No income categories.</p>
          ) : (
            renderCategoryGrid(incomes)
          )}
        </div>
      </div>
    </div>
  );
}
