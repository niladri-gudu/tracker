"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransactionAction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";

interface DeleteTransactionButtonProps {
  transactionId: string;
}

export function DeleteTransactionButton({ transactionId }: DeleteTransactionButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction? The corresponding account balance(s) will be automatically reverted."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await deleteTransactionAction(transactionId);
      if (!res.success) {
        alert(res.error || "Failed to delete transaction.");
      }
    } catch (err: any) {
      alert(err?.message || "An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={deleting}
      onClick={handleDelete}
      className="size-11 flex items-center justify-center border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-sm active:scale-95 transition-all text-muted-foreground"
      aria-label="Delete Transaction"
      title="Delete Transaction"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
