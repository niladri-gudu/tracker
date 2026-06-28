"use client";

import { Trash2 } from "lucide-react";
import { deleteTransactionAction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteTransactionButtonProps {
  transactionId: string;
}

export function DeleteTransactionButton({ transactionId }: DeleteTransactionButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteTransactionAction,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
      } else {
        alert(res.error || "Failed to delete transaction.");
      }
    },
    onError: (err: any) => {
      alert(err?.message || "An unexpected error occurred.");
    },
  });

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction? The corresponding account balance(s) will be automatically reverted."
    );
    if (!confirmDelete) return;
    mutation.mutate(transactionId);
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={mutation.isPending}
      onClick={handleDelete}
      className="size-11 flex items-center justify-center border-zinc-800 hover:bg-destructive/10 hover:text-red-500 hover:border-red-500/30 rounded-lg active:scale-95 transition-all duration-200 text-zinc-400"
      aria-label="Delete Transaction"
      title="Delete Transaction"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
