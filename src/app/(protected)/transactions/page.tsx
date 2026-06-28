import Link from "next/link";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import { getTransactionsAction } from "@/actions/transactions";
import TransactionDialog from "@/components/transaction-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { ArrowRight, ArrowLeftRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ account?: string }>;
}

export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filterAccountId = resolvedSearchParams.account;

  // Parallel server fetches
  const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
    getAccountsAction(),
    getCategoriesAction(),
    getTransactionsAction(filterAccountId ? { accountId: filterAccountId } : undefined),
  ]);

  const accountsList = accountsRes.success && accountsRes.data ? accountsRes.data : [];
  const categoriesList = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const transactionsList = transactionsRes.success && transactionsRes.data ? transactionsRes.data : [];

  // Group transactions by date (YYYY-MM-DD string)
  const groupedTransactions: Record<string, typeof transactionsList> = {};
  transactionsList.forEach((tx) => {
    // Format date string as YYYY-MM-DD
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">
              Filter Account:
            </span>
            <Link
              href="/transactions"
              className={cn(
                "h-8 px-3 flex items-center text-xs font-bold border transition-all rounded-sm",
                !filterAccountId
                  ? "bg-foreground text-background border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-zinc-800/20"
              )}
            >
              All
            </Link>
            {accountsList.map((acc) => (
              <Link
                key={acc.id}
                href={`/transactions?account=${acc.id}`}
                className={cn(
                  "h-8 px-3 flex items-center text-xs font-bold border transition-all rounded-sm",
                  filterAccountId === acc.id
                    ? "bg-foreground text-background border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-zinc-800/20"
                )}
              >
                {acc.name}
              </Link>
            ))}
          </div>

          {/* Ledger Lists */}
          {transactionsList.length === 0 ? (
            <div className="border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-sm text-muted-foreground">No transactions logged.</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Tap "Add Transaction" to log an inflow, outflow, or transfer.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(groupedTransactions).map(([dateStr, txs]) => (
                <div key={dateStr} className="flex flex-col gap-2">
                  {/* Day Header */}
                  <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase border-b border-border pb-1">
                    {formatDateHeader(dateStr)}
                  </h3>

                  {/* Transactions of the day */}
                  <div className="flex flex-col gap-2">
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
                          className="flex items-center justify-between p-3 border border-border bg-card rounded-sm hover:border-muted-foreground/20 transition-all gap-4"
                        >
                          {/* Left details */}
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

                          {/* Right Amount & Delete */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
