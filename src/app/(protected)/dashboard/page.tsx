"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardStatsAction } from "@/actions/dashboard";
import { getSubscriptionsAction, triggerSubscriptionPaymentAction } from "@/actions/subscriptions";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, ArrowRight, ArrowLeftRight, Tag, CalendarClock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function getDaysRemaining(dateStr: string | Date) {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays === -1) return "1 day overdue";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  return `Due in ${diffDays} days`;
}

function PaySubButton({ subId }: { subId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: triggerSubscriptionPaymentAction,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      } else {
        alert(res.error || "Failed to log recurring payment.");
      }
    },
  });

  return (
    <Button
      size="sm"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(subId)}
      className="h-8 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-[10px] uppercase tracking-wide rounded-md active:scale-95 duration-200 cursor-pointer shrink-0"
    >
      {mutation.isPending ? "Logging..." : "Log Pay"}
    </Button>
  );
}

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

  const { data: subscriptionsList = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await getSubscriptionsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
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

      {/* Active Budgets Progress */}
      {stats.budgetsDetails && stats.budgetsDetails.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase select-none">
              Budget Constraints
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.budgetsDetails.map((b) => {
              const percent = b.limitAmount > 0 ? Math.min((b.spentAmount / b.limitAmount) * 100, 100) : 0;
              const isOver = b.spentAmount > b.limitAmount;
              const IconComponent = CATEGORY_ICONS[b.categoryIcon as keyof typeof CATEGORY_ICONS] || Tag;
              const colorHex = b.categoryColor || "#71717a";

              return (
                <div
                  key={b.id}
                  className="border border-zinc-800 bg-zinc-900/70 p-4 rounded-xl flex flex-col gap-3 transition-all hover:border-zinc-700/80 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="size-8 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${colorHex}15`,
                          color: colorHex,
                        }}
                      >
                        <IconComponent className="size-4" />
                      </div>
                      <span className="text-sm font-semibold truncate text-zinc-50">
                        {b.categoryName}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">
                      ₹{b.spentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₹{b.limitAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOver ? "bg-red-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-0.5">
                      <span className={cn(isOver ? "text-red-500 font-bold" : "text-zinc-500")}>
                        {isOver ? "Over budget limit" : `${Math.round(percent)}% spent`}
                      </span>
                      {b.limitAmount - b.spentAmount >= 0 ? (
                        <span className="text-zinc-500 font-mono">
                          ₹{(b.limitAmount - b.spentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left
                        </span>
                      ) : (
                        <span className="text-red-500 font-mono font-bold">
                          -₹{Math.abs(b.limitAmount - b.spentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Recurring Bills */}
      {subscriptionsList.filter((sub) => {
        if (!sub.isActive) return false;
        const target = new Date(sub.nextDueDate);
        target.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-sm font-bold text-zinc-400 tracking-widest uppercase select-none">
              Upcoming Bills & Subs
            </h2>
            <Link
              href="/subscriptions"
              className="text-xs text-emerald-500 hover:underline font-semibold transition-all font-sans"
            >
              Manage Bills →
            </Link>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-850">
            {subscriptionsList
              .filter((sub) => {
                if (!sub.isActive) return false;
                const target = new Date(sub.nextDueDate);
                target.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = target.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              })
              .map((sub) => {
                const Icon = CATEGORY_ICONS[sub.categoryIcon as keyof typeof CATEGORY_ICONS] || Tag;
                const daysRemainingStr = getDaysRemaining(sub.nextDueDate);
                const isOverdue = daysRemainingStr.includes("overdue");
                const isDueToday = daysRemainingStr === "Due today";

                return (
                  <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors duration-200 select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-9 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: sub.categoryColor ? `${sub.categoryColor}15` : "#27272a20",
                          color: sub.categoryColor || "#71717a",
                        }}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-zinc-50 flex items-center gap-1.5">
                          {sub.name}
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">
                            {sub.frequency}
                          </span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                          Via {sub.accountName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col text-right">
                        <span
                          className={cn(
                            "text-xs font-black tracking-tight",
                            sub.type === "expense" ? "text-red-500" : "text-emerald-500"
                          )}
                        >
                          {sub.type === "expense" ? "-" : "+"}
                          ₹{parseFloat(sub.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold mt-0.5",
                            isOverdue
                              ? "text-red-400"
                              : isDueToday
                              ? "text-amber-400"
                              : "text-zinc-400"
                          )}
                        >
                          {daysRemainingStr}
                        </span>
                      </div>

                      <PaySubButton subId={sub.id} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
