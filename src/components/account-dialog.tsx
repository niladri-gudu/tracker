"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { executeCreateAccount } from "@/lib/offline-mutations";
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

export default function AccountDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank" | "investment">("cash");
  const [balance, setBalance] = useState("0.00");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (raw: any) => executeCreateAccount(queryClient, raw),
    onSuccess: (res: any) => {
      if (!res.success) {
        setError(res.error || "Failed to create account.");
      } else {
        // Reset and close dialog
        setName("");
        setType("cash");
        setBalance("0.00");
        setOpen(false);
        if (!res.offline) {
          queryClient.invalidateQueries({ queryKey: ["accounts"] });
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

    mutation.mutate({
      name,
      type,
      balance,
      currency: "INR",
    });
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold flex items-center gap-2 rounded-lg transition-all active:scale-[0.98]">
            <Plus className="size-4 stroke-[2.5]" />
            New Account
          </Button>
        }
      />
      <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
            Create Manual Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          {error && (
            <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account Name
            </Label>
            <Input
              id="account-name"
              type="text"
              placeholder="e.g. Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account Type
            </Label>
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={loading}
              className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800 select-none cursor-pointer"
            >
              <option value="cash">Cash (Physical Wallet)</option>
              <option value="bank">Bank (Checking/Savings)</option>
              <option value="investment">Investment (Brokerage)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="initial-balance" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Starting Balance
            </Label>
            <Input
              id="initial-balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
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
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
