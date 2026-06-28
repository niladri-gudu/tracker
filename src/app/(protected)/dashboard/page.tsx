import { getDashboardStatsAction } from "@/actions/dashboard";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, ArrowRight, ArrowLeftRight, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const response = await getDashboardStatsAction();
  
  const stats = response.success && response.data ? response.data : {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    activeBudgetsCount: 0,
    recentTransactions: [],
  };

  const recentTransactions = stats.recentTransactions || [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor your real-time cash flows and manual account balances.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        {/* Net Worth */}
        <div className="border border-border bg-card p-5 rounded-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Worth</h2>
            <Wallet className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black mt-2 text-[#10b981]">
            ₹{stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Monthly Income */}
        <div className="border border-border bg-card p-5 rounded-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Income (Month)</h2>
            <ArrowUpRight className="size-4 text-[#10b981]" />
          </div>
          <p className="text-2xl font-black mt-2 text-[#10b981]">
            ₹{stats.monthlyIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="border border-border bg-card p-5 rounded-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expenses (Month)</h2>
            <ArrowDownRight className="size-4 text-[#ef4444]" />
          </div>
          <p className="text-2xl font-black mt-2 text-[#ef4444]">
            ₹{stats.monthlyExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Budgets */}
        <div className="border border-border bg-card p-5 rounded-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Budgets</h2>
            <PiggyBank className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black mt-2 text-foreground">
            {stats.activeBudgetsCount}
          </p>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
            Recent Activity
          </h2>
          {recentTransactions.length > 0 && (
            <Link
              href="/transactions"
              className="text-xs text-[#10b981] hover:underline font-semibold transition-all"
            >
              View Full Ledger →
            </Link>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
            <p className="text-sm text-muted-foreground">No transaction logs found.</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Configure your manual accounts first, then go to the{" "}
              <Link href="/transactions" className="text-[#10b981] underline font-medium">
                Ledger Page
              </Link>{" "}
              to log your first entry.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTransactions.map((tx) => {
              const amountVal = parseFloat(tx.amount);
              
              // Resolve Icon & Color
              let IconComponent = Tag;
              let iconColor = "#71717a"; // zinc-500
              if (tx.type === "transfer") {
                IconComponent = ArrowLeftRight;
                iconColor = "#a1a1aa"; // zinc-400
              } else if (tx.categoryIcon) {
                IconComponent = CATEGORY_ICONS[tx.categoryIcon as keyof typeof CATEGORY_ICONS] || Tag;
                iconColor = tx.categoryColor || iconColor;
              }

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border border-border bg-card rounded-sm hover:border-muted-foreground/20 transition-all gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="size-10 rounded-sm flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${iconColor}15`,
                        color: iconColor,
                      }}
                    >
                      <IconComponent className="size-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {tx.type === "transfer"
                          ? "Transfer"
                          : tx.categoryName || "Uncategorized"}
                      </span>
                      {tx.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-xs mt-0.5">
                          {tx.description}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-1 font-mono uppercase">
                        <span>{tx.accountName}</span>
                        {tx.type === "transfer" && (
                          <>
                            <ArrowRight className="size-3 shrink-0" />
                            <span>{tx.toAccountName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-black tracking-tight",
                        tx.type === "expense"
                          ? "text-[#ef4444]"
                          : tx.type === "income"
                          ? "text-[#10b981]"
                          : "text-foreground"
                      )}
                    >
                      {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                      ₹{amountVal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <DeleteTransactionButton transactionId={tx.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
