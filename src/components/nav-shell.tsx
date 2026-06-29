"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, History, Tag, LogOut, Plus, PieChart, CalendarClock, MoreHorizontal } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import TransactionDialog from "@/components/transaction-dialog";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface NavShellProps {
  children: React.ReactNode;
  session: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function NavShell({ children, session }: NavShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isOnline = useNetworkStatus();

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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Accounts", href: "/accounts", icon: Wallet },
    { name: "Ledger", href: "/transactions", icon: History },
    { name: "Categories", href: "/categories", icon: Tag },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Bills & Subs", href: "/subscriptions", icon: CalendarClock },
  ];



  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Floating Offline indicator for mobile viewports */}
      {!isOnline && (
        <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-zinc-950 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm animate-pulse select-none">
          Offline Mode
        </div>
      )}

      {/* DESKTOP SIDEBAR - Hidden on Mobile */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border flex-col justify-between py-6 px-4 z-30">
        <div className="flex flex-col gap-8">
          {/* Logo / Header */}
          <div className="px-3 flex items-center gap-2">
            <span className="size-3 bg-emerald-500 rounded-md" />
            <span className="font-bold text-lg tracking-tight text-foreground">Money Tracker</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium transition-all duration-200 active:bg-zinc-800",
                    isActive
                      ? "bg-zinc-900 text-foreground border-l-2 border-emerald-500 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/20"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-emerald-500" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-border pt-4 px-2 flex flex-col gap-4">
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-semibold select-none animate-pulse">
              <span className="size-1.5 bg-amber-500 rounded-full" />
              Offline Mode
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate text-foreground">{session.user.name || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-800/30 active:bg-zinc-800/50 active:scale-[0.98] transition-all duration-200 border border-transparent hover:border-border"
          >
            <LogOut className="size-4" />
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      {/* Placed md:pl-64 on desktop, and vertical paddings pt-4 pb-16 on mobile to avoid bars */}
      <main className="flex-1 flex flex-col min-h-screen pt-4 pb-16 md:pt-0 md:pb-0 md:pl-64">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR - Hidden on Desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-40 pb-safe" aria-label="Mobile Navigation">
        {/* 1. Overview */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center size-12 rounded-lg transition-all duration-200 active:bg-zinc-800 active:scale-95",
            pathname === "/dashboard" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Overview</span>
        </Link>

        {/* 2. Ledger */}
        <Link
          href="/transactions"
          className={cn(
            "flex flex-col items-center justify-center size-12 rounded-lg transition-all duration-200 active:bg-zinc-800 active:scale-95",
            pathname === "/transactions" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <History className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Ledger</span>
        </Link>

        {/* 3. Quick Entry FAB */}
        <button
          className="size-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center rounded-full shadow transition-all duration-200 active:scale-90"
          aria-label="Add Transaction"
          onClick={() => {
            if (!accountsQuery.data || accountsQuery.data.length === 0) {
              alert("You must configure at least one account before logging a transaction. Redirecting to Accounts page...");
              router.push("/accounts");
            } else {
              setQuickEntryOpen(true);
            }
          }}
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* 4. Accounts */}
        <Link
          href="/accounts"
          className={cn(
            "flex flex-col items-center justify-center size-12 rounded-lg transition-all duration-200 active:bg-zinc-800 active:scale-95",
            pathname === "/accounts" ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          <Wallet className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">Accounts</span>
        </Link>

        {/* 5. More */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center size-12 rounded-lg transition-all duration-200 active:bg-zinc-800 active:scale-95 cursor-pointer",
            ["/analytics", "/subscriptions", "/categories"].includes(pathname)
              ? "text-emerald-500"
              : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="size-5" />
          <span className="text-[10px] mt-0.5 font-medium">More</span>
        </button>
      </nav>

      {/* Mobile More Options Bottom Sheet */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50 rounded-t-2xl rounded-b-none fixed bottom-0">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400 select-none">
              More Options
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-1.5 mt-3 select-none">
            {/* Analytics */}
            <Link
              href="/analytics"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 h-12 rounded-lg text-sm font-bold transition-all",
                pathname === "/analytics"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-300 hover:bg-zinc-800/30"
              )}
            >
              <PieChart className="size-4.5" />
              Analytics
            </Link>

            {/* Bills & Subs */}
            <Link
              href="/subscriptions"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 h-12 rounded-lg text-sm font-bold transition-all",
                pathname === "/subscriptions"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-300 hover:bg-zinc-800/30"
              )}
            >
              <CalendarClock className="size-4.5" />
              Bills & Subscriptions
            </Link>

            {/* Categories */}
            <Link
              href="/categories"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 h-12 rounded-lg text-sm font-bold transition-all",
                pathname === "/categories"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-300 hover:bg-zinc-800/30"
              )}
            >
              <Tag className="size-4.5" />
              Categories
            </Link>

            <div className="h-px bg-zinc-800 my-2" />

            {/* Sign Out */}
            <button
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-3 h-12 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="size-4.5" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Quick Entry Dialog */}
      {accountsQuery.data && accountsQuery.data.length > 0 && (
        <TransactionDialog
          accountsList={accountsQuery.data}
          categoriesList={categoriesQuery.data || []}
          open={quickEntryOpen}
          onOpenChange={setQuickEntryOpen}
        />
      )}
    </div>
  );
}
