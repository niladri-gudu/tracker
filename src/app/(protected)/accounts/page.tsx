"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import AccountDialog from "@/components/account-dialog";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { Wallet, Landmark, BarChart3 } from "lucide-react";

export default function AccountsPage() {
  const { data: list, isLoading, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await getAccountsAction();
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
        <div className="h-28 max-w-xs border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load accounts.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  // Group accounts by type
  const grouped = {
    cash: list.filter((a) => a.type === "cash"),
    bank: list.filter((a) => a.type === "bank"),
    investment: list.filter((a) => a.type === "investment"),
  };

  // Calculate totals
  const totalBalance = list.reduce((acc, current) => {
    const val = parseFloat(current.balance);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const getIcon = (type: string) => {
    switch (type) {
      case "bank":
        return Landmark;
      case "investment":
        return BarChart3;
      default:
        return Wallet;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage your physical wallets, bank balances, and investments.</p>
        </div>
        <div>
          <AccountDialog />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
          <p className="text-sm text-muted-foreground">No accounts configured.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Tap the button above to create your first manual cash wallet or bank balance.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary Banner */}
          <div className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col gap-1 sm:max-w-xs">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Net Worth (INR)
            </span>
            <span className="text-3xl font-black text-emerald-500 mt-1">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Grouped lists */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(grouped).map(([type, items]) => {
              if (items.length === 0) return null;
              const IconComponent = getIcon(type);
              const displayName = type.toUpperCase();

              return (
                <div key={type} className="border border-zinc-800 bg-zinc-900/70 p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <IconComponent className="size-4 text-zinc-400" />
                    <h2 className="text-xs font-bold text-zinc-400 tracking-widest">{displayName}</h2>
                  </div>

                  <div className="flex flex-col border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800">
                    {items.map((account) => {
                      const amount = parseFloat(account.balance);
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 hover:bg-zinc-800/10 transition-colors duration-200"
                        >
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-sm font-semibold truncate text-zinc-50">{account.name}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-black text-zinc-50">
                              ₹{amount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <DeleteAccountButton accountId={account.id} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
