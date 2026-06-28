"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import { getTransactionsAction } from "@/actions/transactions";
import TransactionDialog from "@/components/transaction-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { ArrowRight, ArrowLeftRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const filterAccountId = searchParams.get("account") || undefined;

  // React Query parallel fetches
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await getAccountsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", filterAccountId],
    queryFn: async () => {
      const res = await getTransactionsAction(filterAccountId ? { accountId: filterAccountId } : undefined);
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const isLoading = accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading;
  const error = accountsQuery.error || categoriesQuery.error || transactionsQuery.error;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="h-10 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load transactions.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  const accountsList = accountsQuery.data || [];
  const categoriesList = categoriesQuery.data || [];
  const transactionsList = transactionsQuery.data || [];

  // Group transactions by date (YYYY-MM-DD string)
  const groupedTransactions: Record<string, typeof transactionsList> = {};
  transactionsList.forEach((tx) => {
    const dateStr = new Date(tx.date).toISOString().split("T")[0];
    if (!groupedTransactions[dateStr]) {
      groupedTransactions[dateStr] = [];
    }
    groupedTransactions[dateStr].push(tx);
  });

  const formatDateHeader = (dateString: string) => {
    const dateObj = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ledger</h1>
          <p className="text-sm text-muted-foreground">Monitor and track your cash flows chronologically.</p>
        </div>
        {accountsList.length > 0 && (
          <div>
            <TransactionDialog accountsList={accountsList} categoriesList={categoriesList} />
          </div>
        )}
      </div>

      {accountsList.length === 0 ? (
        <div className="border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
          <p className="text-sm text-muted-foreground">No accounts found.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            You must create an account first in the{" "}
            <Link href="/accounts" className="text-[#10b981] underline">
              Accounts Section
            </Link>{" "}
            before you can log transactions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Filters Row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mr-2 select-none">
              Filter Account:
            </span>
            <Link
              href="/transactions"
              className={cn(
                "h-8 px-3 flex items-center text-xs font-bold border transition-all duration-200 rounded-lg active:scale-95",
                !filterAccountId
                  ? "bg-zinc-50 text-zinc-950 border-transparent"
                  : "border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/20"
              )}
            >
              All
            </Link>
            {accountsList.map((acc) => (
              <Link
                key={acc.id}
                href={`/transactions?account=${acc.id}`}
                className={cn(
                  "h-8 px-3 flex items-center text-xs font-bold border transition-all duration-200 rounded-lg active:scale-95",
                  filterAccountId === acc.id
                    ? "bg-zinc-50 text-zinc-950 border-transparent"
                    : "border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/20"
                )}
              >
                {acc.name}
              </Link>
            ))}
          </div>

          {/* Ledger Lists */}
          {transactionsList.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900/50 p-8 rounded-xl flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-sm text-zinc-400">No transactions logged.</p>
              <p className="text-xs text-zinc-500 mt-1">
                Tap "Add Transaction" to log an inflow, outflow, or transfer.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(groupedTransactions).map(([dateStr, txs]) => (
                <div key={dateStr} className="flex flex-col gap-2">
                  {/* Day Header */}
                  <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800 pb-1 select-none">
                    {formatDateHeader(dateStr)}
                  </h3>

                  {/* Transactions of the day */}
                  <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800">
                    {txs.map((tx) => {
                      const amountVal = parseFloat(tx.amount);
                      
                      // Resolve Icon & Color
                      let IconComponent = Tag;
                      let iconColor = "#71717a"; // zinc-500 default
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
                          {/* Left details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="size-10 rounded-md flex items-center justify-center shrink-0 animate-fade-in"
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

                          {/* Right Amount & Delete */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
