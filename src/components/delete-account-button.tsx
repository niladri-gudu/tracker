"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/accounts";
import { Button } from "@/components/ui/button";

interface DeleteAccountButtonProps {
  accountId: string;
}

export function DeleteAccountButton({ accountId }: DeleteAccountButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this account? All associated transaction records will be permanently removed."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await deleteAccountAction(accountId);
      if (!res.success) {
        alert(res.error || "Failed to delete account.");
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
      aria-label="Delete Account"
      title="Delete Account"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
