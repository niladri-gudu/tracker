"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsAction } from "@/actions/dashboard";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, ArrowRight, ArrowLeftRight, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await getDashboardStatsAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-20 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          ))}
        </div>
        <div className="h-48 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load overview data.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

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
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Net Worth</h2>
            <Wallet className="size-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-500">
            ₹{stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Monthly Income */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Income (Month)</h2>
            <ArrowUpRight className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-500">
            ₹{stats.monthlyIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expenses (Month)</h2>
            <ArrowDownRight className="size-4 text-red-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-red-500">
            ₹{stats.monthlyExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Budgets */}
        <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Budgets</h2>
            <PiggyBank className="size-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-zinc-50">
            {stats.activeBudgetsCount}
          </p>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase">
            Recent Activity
          </h2>
          {recentTransactions.length > 0 && (
            <Link
              href="/transactions"
              className="text-xs text-emerald-500 hover:underline font-semibold transition-all font-sans"
            >
              View Full Ledger →
            </Link>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900/50 p-8 rounded-xl flex flex-col items-center justify-center min-h-[200px] text-center">
            <p className="text-sm text-zinc-400">No transaction logs found.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Configure your manual accounts first, then go to the{" "}
              <Link href="/transactions" className="text-emerald-500 underline font-medium">
                Ledger Page
              </Link>{" "}
              to log your first entry.
            </p>
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800">
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
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors duration-200 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="size-10 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${iconColor}15`,
                        color: iconColor,
                      }}
                    >
                      <IconComponent className="size-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-zinc-50">
                        {tx.type === "transfer"
                          ? "Transfer"
                          : tx.categoryName || "Uncategorized"}
                      </span>
                      {tx.description && (
                        <span className="text-xs text-zinc-400 truncate max-w-[200px] md:max-w-xs mt-0.5">
                          {tx.description}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400/60 mt-1 font-mono uppercase">
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
                          ? "text-red-500"
                          : tx.type === "income"
                          ? "text-emerald-500"
                          : "text-zinc-50"
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
