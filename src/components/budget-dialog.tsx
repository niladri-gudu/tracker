"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { executeCreateOrUpdateBudget, executeDeleteBudget } from "@/lib/offline-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BudgetDialogProps {
  category: {
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
  };
  existingBudget?: {
    id: string;
    limitAmount: string;
  };
}

export default function BudgetDialog({ category, existingBudget }: BudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [limitAmount, setLimitAmount] = useState(existingBudget?.limitAmount || "");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const setMutation = useMutation({
    mutationFn: (raw: any) => executeCreateOrUpdateBudget(queryClient, raw, [category]),
    onSuccess: (res: any) => {
      if (!res.success) {
        setError(res.error || "Failed to save budget.");
      } else {
        setOpen(false);
        if (!res.offline) {
          queryClient.invalidateQueries({ queryKey: ["budgets"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      }
    },
    onError: (err: any) => {
      setError(err?.message || "An unexpected error occurred.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => executeDeleteBudget(queryClient, id),
    onSuccess: (res: any) => {
      if (!res.success) {
        setError(res.error || "Failed to delete budget.");
      } else {
        setLimitAmount("");
        setOpen(false);
        if (!res.offline) {
          queryClient.invalidateQueries({ queryKey: ["budgets"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      }
    },
    onError: (err: any) => {
      setError(err?.message || "An unexpected error occurred.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setMutation.mutate({
      categoryId: category.id,
      limitAmount,
    });
  };

  const handleDelete = () => {
    if (!existingBudget) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the budget constraint for category "${category.name}"?`
    );
    if (!confirmDelete) return;
    setError(null);
    deleteMutation.mutate(existingBudget.id);
  };

  const loading = setMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          existingBudget ? (
            <Button
              variant="outline"
              size="xs"
              className="h-7 gap-1 border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-zinc-50 rounded-md active:scale-95 duration-200"
            >
              Edit Budget
            </Button>
          ) : (
            <Button
              variant="outline"
              size="xs"
              className="h-7 gap-1 border-zinc-800 text-[11px] font-bold text-emerald-500 hover:text-emerald-400 rounded-md active:scale-95 duration-200"
            >
              + Budget
            </Button>
          )
        }
      />
      <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <PiggyBank className="size-5 text-emerald-500" />
            {existingBudget ? "Modify Budget Limit" : "Set Monthly Budget"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          {error && (
            <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive rounded-lg">
              {error}
            </div>
          )}

          {/* Category display details */}
          <div className="flex items-center gap-3 p-3 border border-zinc-800 bg-zinc-900/50 rounded-xl select-none">
            <div
              className="size-10 rounded-md flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${category.color}15`,
                color: category.color,
              }}
            >
              <PiggyBank className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Category
              </span>
              <span className="text-sm font-bold text-zinc-50">
                {category.name}
              </span>
            </div>
          </div>

          {/* Limit amount input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="limit-amount" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Monthly Spend Limit
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold select-none">
                ₹
              </span>
              <Input
                id="limit-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                required
                disabled={loading}
                className="h-11 pl-8 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500 font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 mt-2 border-t border-zinc-800 pt-4">
            {existingBudget ? (
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={handleDelete}
                className="h-11 px-4 transition-all duration-200 active:scale-95 text-xs rounded-lg"
              >
                Delete Budget
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="h-11 px-4 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 transition-all rounded-lg duration-200 active:scale-95"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 transition-all rounded-lg duration-200 active:scale-95"
              >
                {loading ? "Saving..." : "Save Limit"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
