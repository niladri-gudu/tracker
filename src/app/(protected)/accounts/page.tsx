import { getAccountsAction } from "@/actions/accounts";
import AccountDialog from "@/components/account-dialog";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { Wallet, Landmark, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const response = await getAccountsAction();
  const list = response.success && response.data ? response.data : [];

  // Group accounts by type
  const grouped = {
    cash: list.filter((a) => a.type === "cash"),
    bank: list.filter((a) => a.type === "bank"),
    investment: list.filter((a) => a.type === "investment"),
  };

  // Calculate totals (assumes same currency for simple total, but prints separately if different)
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
          <div className="border border-border bg-[#18181b] p-5 rounded-sm flex flex-col gap-1 sm:max-w-xs">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Net Worth (INR)
            </span>
            <span className="text-3xl font-black text-[#10b981] mt-1">
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
                <div key={type} className="border border-border bg-card p-5 rounded-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <IconComponent className="size-4 text-muted-foreground" />
                    <h2 className="text-xs font-bold text-muted-foreground tracking-widest">{displayName}</h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {items.map((account) => {
                      const amount = parseFloat(account.balance);
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 border border-border bg-[#1c1c1f] rounded-sm hover:border-muted-foreground/30 transition-all"
                        >
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-sm font-semibold truncate text-foreground">{account.name}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-black text-foreground">
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
