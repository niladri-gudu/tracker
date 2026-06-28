"use client";

import { useState } from "react";
import {
  Plus,
  DollarSign,
  Briefcase,
  TrendingUp,
  Utensils,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Tv,
  Heart,
  Plane,
  Gift,
  Tag,
} from "lucide-react";
import { createCategoryAction } from "@/actions/categories";
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

const CATEGORY_ICONS = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Utensils,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Tv,
  Heart,
  Plane,
  Gift,
  Tag,
};

const PALETTE = [
  "#10b981", // Emerald Green
  "#3b82f6", // Indigo Blue
  "#ef4444", // Rose Red
  "#f59e0b", // Amber Yellow
  "#06b6d4", // Cyan Teal
  "#a855f7", // Purple Violet
  "#ec4899", // Pink
  "#71717a", // Zinc Gray
];

export default function CategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof CATEGORY_ICONS>("Tag");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCategoryAction,
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.error || "Failed to create category.");
      } else {
        setName("");
        setType("expense");
        setSelectedIcon("Tag");
        setSelectedColor(PALETTE[0]);
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-11 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold flex items-center gap-2 rounded-lg transition-all active:scale-[0.98]">
            <Plus className="size-4 stroke-[2.5]" />
            New Category
          </Button>
        }
      />
      <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
            Create Custom Category
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          {error && (
            <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Category Name
            </Label>
            <Input
              id="category-name"
              type="text"
              placeholder="e.g. Subscriptions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Flow Type
            </Label>
            <select
              id="category-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={loading}
              className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800 select-none cursor-pointer"
            >
              <option value="expense">Expense (Outflow)</option>
              <option value="income">Income (Inflow)</option>
            </select>
          </div>

          {/* ICON PICKER */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Choose Icon
            </Label>
            <div className="grid grid-cols-5 gap-2 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg max-h-[140px] overflow-y-auto">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
                const isSelected = selectedIcon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key as any)}
                    className={cn(
                      "size-11 flex items-center justify-center rounded-md border border-transparent hover:bg-zinc-800/50 transition-all duration-200 active:scale-95",
                      isSelected ? "border-emerald-500 bg-zinc-800/80 text-emerald-500" : "text-zinc-400"
                    )}
                    aria-label={`Select icon ${key}`}
                  >
                    <Icon className="size-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLOR PICKER */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accent Color
            </Label>
            <div className="flex flex-wrap gap-2.5 mt-0.5">
              {PALETTE.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="size-8 rounded-full border-2 transition-all active:scale-90"
                    style={{
                      backgroundColor: color,
                      borderColor: isSelected ? "#fafafa" : "transparent",
                    }}
                    aria-label={`Select color ${color}`}
                  />
                );
              })}
            </div>
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
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export { CATEGORY_ICONS };
