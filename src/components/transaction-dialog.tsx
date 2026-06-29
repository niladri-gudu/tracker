"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createTransactionAction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransactionDialogProps {
  accountsList: Array<{ id: string; name: string; type: string }>;
  categoriesList: Array<{ id: string; name: string; type: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

export default function TransactionDialog({
  accountsList,
  categoriesList,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(() => accountsList[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [toAccountId, setToAccountId] = useState(() => accountsList[1]?.id || "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync state once lists become available
  useEffect(() => {
    if (!accountId && accountsList[0]?.id) {
      setAccountId(accountsList[0].id);
    }
    if (!toAccountId && accountsList[1]?.id) {
      setToAccountId(accountsList[1].id);
    }
  }, [accountsList, accountId, toAccountId]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTransactionAction,
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.error || "Failed to log transaction.");
      } else {
        setAmount("");
        setCategoryId("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
      }
    },
    onError: (err: any) => {
      setError(err?.message || "An unexpected error occurred.");
    },
  });

  // Filter categories matching the type (income categories for income, expense for expense)
  const filteredCategories = categoriesList.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    mutation.mutate({
      accountId,
      categoryId: type !== "transfer" && categoryId ? categoryId : null,
      type,
      amount,
      date,
      description: description.trim() || null,
      toAccountId: type === "transfer" ? toAccountId : null,
    });
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button className="h-11 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold flex items-center gap-2 rounded-lg transition-all active:scale-[0.98]">
              <Plus className="size-4 stroke-[2.5]" />
              Add Transaction
            </Button>
          }
        />
      )}
      <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
            Log Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
          {error && (
            <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Type Selector (Toggles) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Flow Type
            </Label>
            <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 border border-zinc-800 p-1 rounded-lg">
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setError(null);
                  }}
                  className={cn(
                    "h-9 text-xs font-bold rounded-md uppercase tracking-wider transition-all select-none cursor-pointer duration-200 active:scale-95",
                    type === t
                      ? t === "expense"
                        ? "bg-red-500 text-zinc-950"
                        : t === "income"
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-50 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
                className="h-11 pl-8 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500 font-semibold"
              />
            </div>
          </div>

          {/* Source Account selection */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source-account" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {type === "transfer" ? "From Account" : "Account"}
            </Label>
            <select
              id="source-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              disabled={loading}
              className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800 select-none cursor-pointer"
            >
              {accountsList.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Destination Selection */}
          {type === "transfer" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dest-account" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                To Account
              </Label>
              <select
                id="dest-account"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
                disabled={loading}
                className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800 select-none cursor-pointer"
              >
                {accountsList.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category selection */}
          {type !== "transfer" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading}
                className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800 select-none cursor-pointer"
              >
                <option value="">Uncategorized</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Selection */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg cursor-pointer"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notes
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g. Weekly Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-3 border-t border-zinc-800 pt-4">
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
              {loading ? "Logging..." : "Log Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
