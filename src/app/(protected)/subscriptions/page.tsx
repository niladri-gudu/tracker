"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import {
  getSubscriptionsAction,
  createSubscriptionAction,
  deleteSubscriptionAction,
} from "@/actions/subscriptions";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import {
  Plus,
  Trash2,
  CalendarClock,
  Tag,
  Wallet,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to format days remaining
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

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
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

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await getSubscriptionsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const accountsList = accountsQuery.data || [];
  const categoriesList = categoriesQuery.data || [];
  const subscriptionsList = subscriptionsQuery.data || [];

  // Default initial account
  if (!accountId && accountsList.length > 0) {
    setAccountId(accountsList[0].id);
  }

  // Filter categories matching selected type
  const filteredCategories = categoriesList.filter((c) => c.type === type);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSubscriptionAction,
    onSuccess: (res) => {
      if (res.success) {
        setOpen(false);
        // Reset form
        setName("");
        setAmount("");
        setType("expense");
        setCategoryId("");
        setFrequency("monthly");
        setStartDate(new Date().toISOString().split("T")[0]);
        setFormError(null);
        
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } else {
        setFormError(res.error || "Failed to create subscription.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionAction,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } else {
        alert(res.error || "Failed to delete subscription.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Enter a valid amount");
      return;
    }
    if (!accountId) {
      setFormError("Select a linked account");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      amount,
      type,
      accountId,
      categoryId: categoryId || null,
      frequency,
      startDate,
    });
  };

  const isLoading = accountsQuery.isLoading || categoriesQuery.isLoading || subscriptionsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="h-48 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-5 gap-4 flex-wrap select-none">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bills & Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage and track recurring expenses and income streams.</p>
        </div>

        {accountsList.length === 0 ? (
          <Button
            onClick={() => alert("Please add an Account first before creating bills!")}
            className="h-10 px-4 bg-zinc-800 text-zinc-400 font-semibold rounded-lg flex items-center gap-2"
          >
            <Plus className="size-4" />
            Add Bill
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
                  <Plus className="size-4 stroke-[2.5]" />
                  Add Bill
                </Button>
              }
            />
            <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
                  New Subscription / Bill
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
                {formError && (
                  <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive rounded-lg flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Type Selection */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Flow Type</Label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 border border-zinc-800 p-1 rounded-lg">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setCategoryId(""); // reset category on flow type switch
                        }}
                        className={cn(
                          "py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wide cursor-pointer",
                          type === t ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        {t === "expense" ? "Outflow" : "Inflow"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bill Name */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-name">
                    Bill / Subscription Name
                  </Label>
                  <input
                    id="sub-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Netflix, Rent, Salary"
                    className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-zinc-100"
                  />
                </div>

                {/* Amount & Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-amount">
                      Amount
                    </Label>
                    <input
                      id="sub-amount"
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="₹0.00"
                      className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-frequency">
                      Frequency
                    </Label>
                    <select
                      id="sub-frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="h-10 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 cursor-pointer"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Account Selection */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-account">
                    Linked Account
                  </Label>
                  <select
                    id="sub-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="h-10 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 cursor-pointer"
                  >
                    {accountsList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (₹{parseFloat(acc.balance).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-category">
                    Category (Optional)
                  </Label>
                  <select
                    id="sub-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-10 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 cursor-pointer"
                  >
                    <option value="">No Category</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="sub-startdate">
                    Start / Next Billing Date
                  </Label>
                  <input
                    id="sub-startdate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 cursor-pointer"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-11 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg mt-2 cursor-pointer active:scale-95 duration-200"
                >
                  {createMutation.isPending ? "Creating..." : "Save Subscription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Subscription List Feed */}
      {subscriptionsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] border border-dashed border-zinc-800 bg-zinc-900/10 rounded-xl text-center p-6 select-none">
          <CalendarClock className="size-8 text-zinc-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-zinc-400">No active subscriptions configured.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Add recurring costs like Netflix, rent, or salaries here to track and log them easily.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-850">
          {subscriptionsList.map((sub) => {
            const Icon = CATEGORY_ICONS[sub.categoryIcon as keyof typeof CATEGORY_ICONS] || Tag;
            const daysRemainingStr = getDaysRemaining(sub.nextDueDate);
            const isOverdue = daysRemainingStr.includes("overdue");
            const isDueToday = daysRemainingStr === "Due today";

            return (
              <div key={sub.id} className="flex items-center justify-between p-4.5 hover:bg-zinc-800/10 transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category visual representation */}
                  <div
                    className="size-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: sub.categoryColor ? `${sub.categoryColor}15` : "#27272a20",
                      color: sub.categoryColor || "#71717a",
                    }}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-50 flex items-center gap-1.5">
                      {sub.name}
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {sub.frequency}
                      </span>
                    </span>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        <Wallet className="size-3" />
                        {sub.accountName}
                      </span>
                      {sub.categoryName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Tag className="size-3" />
                            {sub.categoryName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col text-right">
                    <span
                      className={cn(
                        "text-xs font-black tracking-tight flex items-center gap-1 justify-end",
                        sub.type === "expense" ? "text-red-500" : "text-emerald-500"
                      )}
                    >
                      {sub.type === "expense" ? "-" : "+"}
                      ₹{parseFloat(sub.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold mt-0.5",
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

                  {/* Deletion Option */}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${sub.name}?`)) {
                        deleteMutation.mutate(sub.id);
                      }
                    }}
                    className="size-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg active:scale-95 duration-200 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
