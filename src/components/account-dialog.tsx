"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createAccountAction({
        name,
        type,
        balance,
        currency: "INR",
      });

      if (!res.success) {
        setError(res.error || "Failed to create account.");
      } else {
        // Reset and close dialog
        setName("");
        setType("cash");
        setBalance("0.00");
        setOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 px-4 bg-[#10b981] hover:bg-[#10b981]/90 text-[#09090b] font-medium flex items-center gap-2 rounded-sm transition-all active:scale-[0.98]">
            <Plus className="size-4 stroke-[2.5]" />
            New Account
          </Button>
        }
      />
      <DialogContent className="max-w-sm border border-border bg-[#09090b] p-6 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
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
              className="h-11 bg-[#18181b] border-border text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account Type
            </Label>
            {/* Native HTML Select used for responsive mobile native picker compatibility */}
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={loading}
              className="h-11 px-3 bg-[#18181b] border border-border text-foreground rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ring select-none cursor-pointer"
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
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-[#18181b] border-border text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
            />
          </div>



          <div className="flex gap-3 justify-end mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="h-11 px-4 border-border text-muted-foreground hover:text-foreground hover:bg-zinc-800/30 transition-all rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/95 transition-all rounded-sm active:scale-[0.98]"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
