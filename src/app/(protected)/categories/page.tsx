"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategoriesAction } from "@/actions/categories";
import CategoryDialog, { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Tag } from "lucide-react";
import { getBudgetsAction } from "@/actions/budgets";
import BudgetDialog from "@/components/budget-dialog";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data || [];
    },
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await getBudgetsAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data || [];
    },
  });

  const isLoading = categoriesQuery.isLoading || budgetsQuery.isLoading;
  const error = categoriesQuery.error || budgetsQuery.error;
  const list = categoriesQuery.data || [];

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load categories or budgets.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  // Filter into incomes and expenses
  const expenses = list.filter((c) => c.type === "expense");
  const incomes = list.filter((c) => c.type === "income");

  const budgetsMap = new Map(budgetsQuery.data?.map((b) => [b.categoryId, b]) || []);

  const renderCategoryGrid = (items: typeof list) => (
    <div className="flex flex-col border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800 mt-4">
      {items.map((cat) => {
        // Resolve Icon component
        const IconComponent = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS] || Tag;
        const colorHex = cat.color || "#71717a";
        const existingBudget = budgetsMap.get(cat.id);

        const spent = existingBudget ? existingBudget.spentAmount : 0;
        const limit = existingBudget ? parseFloat(existingBudget.limitAmount) : 0;
        const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const isOver = spent > limit;

        return (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3 hover:bg-zinc-800/10 transition-colors duration-200 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="size-10 rounded-md flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${colorHex}15`,
                  color: colorHex,
                }}
              >
                <IconComponent className="size-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate text-zinc-50">
                  {cat.name}
                </span>

                {cat.type === "expense" && (
                  <div className="mt-1.5 flex flex-col gap-1 w-full max-w-[200px] sm:max-w-xs pr-4">
                    {existingBudget ? (
                      <>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-400 font-mono">
                            ₹{spent.toLocaleString("en-IN")} / ₹{limit.toLocaleString("en-IN")}
                          </span>
                          <span className={cn("font-bold font-mono", isOver ? "text-red-500" : "text-emerald-500")}>
                            {Math.round((spent / limit) * 100)}%
                          </span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isOver ? "bg-red-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-zinc-500 italic select-none">No budget set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cat.type === "expense" && (
                <BudgetDialog category={cat} existingBudget={existingBudget} />
              )}
              <DeleteCategoryButton categoryId={cat.id} />
            </div>
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
