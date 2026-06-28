import { getCategoriesAction } from "@/actions/categories";
import CategoryDialog, { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const response = await getCategoriesAction();
  const list = response.success && response.data ? response.data : [];

  // Group categories by flow type
  const grouped = {
    expense: list.filter((c) => c.type === "expense"),
    income: list.filter((c) => c.type === "income"),
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Classify and group your ledger transaction flows.</p>
        </div>
        <div>
          <CategoryDialog />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mt-2">
        {/* EXPENSE CATEGORIES */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Expenses</h2>
            <span className="text-xs bg-zinc-800 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {grouped.expense.length}
            </span>
          </div>

          {grouped.expense.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No expense categories configured.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {grouped.expense.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] || Tag;
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-border bg-card rounded-sm hover:border-muted-foreground/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className="size-10 rounded-sm flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${category.color}20`, // 12% opacity color background
                          color: category.color,
                        }}
                      >
                        <IconComponent className="size-5" />
                      </div>
                      <span className="text-sm font-semibold truncate text-foreground">{category.name}</span>
                    </div>
                    <DeleteCategoryButton categoryId={category.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* INCOME CATEGORIES */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Income</h2>
            <span className="text-xs bg-zinc-800 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {grouped.income.length}
            </span>
          </div>

          {grouped.income.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No income categories configured.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {grouped.income.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS] || Tag;
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-border bg-card rounded-sm hover:border-muted-foreground/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className="size-10 rounded-sm flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${category.color}20`, // 12% opacity color background
                          color: category.color,
                        }}
                      >
                        <IconComponent className="size-5" />
                      </div>
                      <span className="text-sm font-semibold truncate text-foreground">{category.name}</span>
                    </div>
                    <DeleteCategoryButton categoryId={category.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
