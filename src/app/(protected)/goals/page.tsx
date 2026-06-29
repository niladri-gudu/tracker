"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import {
  getGoalsAction,
  createGoalAction,
  deleteGoalAction,
  adjustGoalFundsAction,
} from "@/actions/goals";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Target,
  Wallet,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SavingsGoalsPage() {
  const queryClient = useQueryClient();
  
  // Dialog Open States
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustGoal, setAdjustGoal] = useState<{
    id: string;
    name: string;
    type: "add" | "withdraw";
    currentAmount: string;
  } | null>(null);

  // Create Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Adjust Form State
  const [adjustAmount, setAdjustAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Queries
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await getAccountsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await getGoalsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const accountsList = accountsQuery.data || [];
  const goalsList = goalsQuery.data || [];

  // Default initial account
  if (!accountId && accountsList.length > 0) {
    setAccountId(accountsList[0].id);
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: createGoalAction,
    onSuccess: (res) => {
      if (res.success) {
        setCreateOpen(false);
        setName("");
        setTargetAmount("");
        setTargetDate("");
        setCreateError(null);
        queryClient.invalidateQueries({ queryKey: ["goals"] });
      } else {
        setCreateError(res.error || "Failed to create savings goal.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoalAction,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["goals"] });
      } else {
        alert(res.error || "Failed to delete savings goal.");
      }
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (variables: { goalId: string; accountId: string; amount: string; type: "add" | "withdraw" }) =>
      adjustGoalFundsAction(variables.goalId, variables.accountId, variables.amount, variables.type),
    onSuccess: (res) => {
      if (res.success) {
        setAdjustGoal(null);
        setAdjustAmount("");
        setAdjustError(null);
        
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      } else {
        setAdjustError(res.error || "Failed to adjust savings goal funds.");
      }
    },
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setCreateError("Enter a valid target amount");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      targetAmount,
      targetDate: targetDate || null,
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);

    if (!adjustGoal) return;
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      setAdjustError("Enter a valid amount");
      return;
    }
    if (!accountId) {
      setAdjustError("Select a source/destination account");
      return;
    }

    adjustMutation.mutate({
      goalId: adjustGoal.id,
      accountId,
      amount: adjustAmount,
      type: adjustGoal.type,
    });
  };

  const totalGoalSavings = goalsList.reduce((acc, g) => acc + parseFloat(g.currentAmount), 0);
  const isLoading = accountsQuery.isLoading || goalsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="h-28 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="h-44 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          <div className="h-44 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-5 gap-4 flex-wrap select-none">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">Set financial targets, allocate funds, and track your milestones.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
                <Plus className="size-4 stroke-[2.5]" />
                New Goal
              </Button>
            }
          />
          <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
                New Savings Goal
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-3">
              {createError && (
                <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive rounded-lg flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {createError}
                </div>
              )}

              {/* Goal Name */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="goal-name">
                  Goal Name
                </Label>
                <input
                  id="goal-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. New Laptop, Emergency Fund"
                  className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-zinc-100"
                />
              </div>

              {/* Target Amount */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="goal-amount">
                  Target Amount
                </Label>
                <input
                  id="goal-amount"
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="₹0.00"
                  className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-zinc-100"
                />
              </div>

              {/* Target Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="goal-date">
                  Target Date (Optional)
                </Label>
                <input
                  id="goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-700 text-zinc-100 cursor-pointer"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg mt-2 cursor-pointer active:scale-95 duration-200"
              >
                {createMutation.isPending ? "Creating..." : "Save Goal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Net Goals Savings Box */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl flex items-center justify-between select-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Stashed in Goals</span>
          <span className="text-2xl font-black tracking-tight text-emerald-500">
            ₹{totalGoalSavings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="size-11 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
          <Target className="size-5.5 stroke-[2.2]" />
        </div>
      </div>

      {/* Goals Grid */}
      {goalsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-zinc-800 bg-zinc-900/10 rounded-xl text-center p-6 select-none">
          <Target className="size-10 text-zinc-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-zinc-400">No savings goals created yet.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Start saving for specific items! Setting goals keeps you motivated and ensures funds are set aside properly.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {goalsList.map((goal) => {
            const currentVal = parseFloat(goal.currentAmount);
            const targetVal = parseFloat(goal.targetAmount);
            const percent = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 0;
            const isCompleted = percent >= 100;

            const daysLeftStr = goal.targetDate
              ? (() => {
                  const target = new Date(goal.targetDate);
                  target.setHours(0,0,0,0);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffTime = target.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 0) return "Target due today!";
                  if (diffDays < 0) return `${Math.abs(diffDays)} days past target date`;
                  return `${diffDays} days remaining`;
                })()
              : null;

            return (
              <div
                key={goal.id}
                className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl flex flex-col gap-4 hover:border-zinc-700/80 transition-all duration-200 select-none"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-zinc-50 truncate flex items-center gap-2">
                      {goal.name}
                      {isCompleted && (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      )}
                    </span>
                    {daysLeftStr && (
                      <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {daysLeftStr}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete goal: ${goal.name}?`)) {
                        deleteMutation.mutate(goal.id);
                      }
                    }}
                    className="size-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg active:scale-95 duration-200 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Progress Stats */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-mono text-zinc-100 font-black">
                      ₹{currentVal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-zinc-500 font-mono">
                      of ₹{targetVal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-emerald-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                    <span>{percent}% Complete</span>
                    {isCompleted && (
                      <span className="text-emerald-500 uppercase tracking-wider">Completed!</span>
                    )}
                  </div>
                </div>

                {/* Quick Fund Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Add Funds Button */}
                  <Button
                    onClick={() => {
                      if (accountsList.length === 0) {
                        alert("Configure an Account first before adding funds!");
                      } else {
                        setAdjustGoal({
                          id: goal.id,
                          name: goal.name,
                          type: "add",
                          currentAmount: goal.currentAmount,
                        });
                      }
                    }}
                    className="h-8 text-[10px] font-bold uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center justify-center gap-1.5 border border-zinc-750 cursor-pointer active:scale-[0.97]"
                  >
                    <ArrowDownRight className="size-3.5 text-emerald-400 shrink-0" />
                    Add Funds
                  </Button>

                  {/* Withdraw Funds Button */}
                  <Button
                    disabled={currentVal <= 0}
                    onClick={() => {
                      if (accountsList.length === 0) {
                        alert("Configure an Account first!");
                      } else {
                        setAdjustGoal({
                          id: goal.id,
                          name: goal.name,
                          type: "withdraw",
                          currentAmount: goal.currentAmount,
                        });
                      }
                    }}
                    className="h-8 text-[10px] font-bold uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center justify-center gap-1.5 border border-zinc-750 cursor-pointer active:scale-[0.97]"
                  >
                    <ArrowUpRight className="size-3.5 text-red-400 shrink-0" />
                    Withdraw
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Withdraw Dialog Drawer */}
      {adjustGoal && (
        <Dialog open={!!adjustGoal} onOpenChange={(isOpen) => !isOpen && setAdjustGoal(null)}>
          <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
                {adjustGoal.type === "add" ? "Allocate Funds" : "Withdraw Funds"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4 mt-3">
              {adjustError && (
                <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive rounded-lg flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {adjustError}
                </div>
              )}

              {/* Displays active goal balance */}
              <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-lg flex flex-col gap-1 select-none">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Goal: {adjustGoal.name}</span>
                <span className="text-xs font-semibold text-zinc-300 mt-1 leading-none">
                  Stashed: ₹{parseFloat(adjustGoal.currentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Amount to Adjust */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="adjust-amount">
                  Amount
                </Label>
                <input
                  id="adjust-amount"
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="₹0.00"
                  className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-zinc-100"
                />
              </div>

              {/* Source/Target Account Selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="adjust-account">
                  {adjustGoal.type === "add" ? "Source Account" : "Destination Account"}
                </Label>
                <select
                  id="adjust-account"
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

              {/* Submit */}
              <Button
                type="submit"
                disabled={adjustMutation.isPending}
                className="h-11 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg mt-2 cursor-pointer active:scale-95 duration-200"
              >
                {adjustMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
