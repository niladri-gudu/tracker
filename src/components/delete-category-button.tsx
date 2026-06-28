"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";

interface DeleteCategoryButtonProps {
  categoryId: string;
}

export function DeleteCategoryButton({ categoryId }: DeleteCategoryButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category? Associated transactions will have their category field set to null."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await deleteCategoryAction(categoryId);
      if (!res.success) {
        alert(res.error || "Failed to delete category.");
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
      aria-label="Delete Category"
      title="Delete Category"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
