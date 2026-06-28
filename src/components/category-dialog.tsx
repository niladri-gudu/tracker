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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createCategoryAction({
        name,
        type,
        icon: selectedIcon,
        color: selectedColor,
      });

      if (!res.success) {
        setError(res.error || "Failed to create category.");
      } else {
        setName("");
        setType("expense");
        setSelectedIcon("Tag");
        setSelectedColor(PALETTE[0]);
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
            New Category
          </Button>
        }
      />
      <DialogContent className="max-w-sm border border-border bg-[#09090b] p-6 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
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
              className="h-11 bg-[#18181b] border-border text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
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
              className="h-11 px-3 bg-[#18181b] border border-border text-foreground rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ring select-none cursor-pointer"
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
            <div className="grid grid-cols-5 gap-2 p-2 bg-[#18181b] border border-border rounded-sm max-h-[140px] overflow-y-auto">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
                const isSelected = selectedIcon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key as any)}
                    className={cn(
                      "size-11 flex items-center justify-center rounded border border-transparent hover:bg-zinc-800 transition-all active:scale-95",
                      isSelected ? "border-primary bg-zinc-800/80 text-[#10b981]" : "text-muted-foreground"
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
              className="h-11 px-4 border-border text-muted-foreground hover:text-foreground hover:bg-zinc-800/30 transition-all rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/95 transition-all rounded-sm active:scale-[0.98]"
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
