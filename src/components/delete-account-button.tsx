"use client";

import { Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteAccountButtonProps {
  accountId: string;
}

export function DeleteAccountButton({ accountId }: DeleteAccountButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteAccountAction,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      } else {
        alert(res.error || "Failed to delete account.");
      }
    },
    onError: (err: any) => {
      alert(err?.message || "An unexpected error occurred.");
    },
  });

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this account? All associated transaction records will be permanently removed."
    );
    if (!confirmDelete) return;
    mutation.mutate(accountId);
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={mutation.isPending}
      onClick={handleDelete}
      className="size-11 flex items-center justify-center border-zinc-800 hover:bg-destructive/10 hover:text-red-500 hover:border-red-500/30 rounded-lg active:scale-95 transition-all duration-200 text-zinc-400"
      aria-label="Delete Account"
      title="Delete Account"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
