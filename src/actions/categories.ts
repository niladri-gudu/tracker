"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(30, "Name is too long"),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, "Icon selection is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income", icon: "DollarSign", color: "#10b981" },
  { name: "Freelance", type: "income", icon: "Briefcase", color: "#6366f1" },
  { name: "Investment", type: "income", icon: "TrendingUp", color: "#f59e0b" },
  { name: "Food & Dining", type: "expense", icon: "Utensils", color: "#ef4444" },
  { name: "Rent & Housing", type: "expense", icon: "Home", color: "#3b82f6" },
  { name: "Utilities", type: "expense", icon: "Zap", color: "#eab308" },
  { name: "Transportation", type: "expense", icon: "Car", color: "#06b6d4" },
  { name: "Shopping", type: "expense", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Entertainment", type: "expense", icon: "Tv", color: "#a855f7" },
] as const;

export async function getCategoriesAction() {
  try {
    const user = await getSessionUser();
    
    let list = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id));

    if (list.length === 0) {
      const values = DEFAULT_CATEGORIES.map((c) => ({
        userId: user.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      }));
      await db.insert(categories).values(values);
      
      list = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, user.id));
    }

    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch categories" };
  }
}

export async function createCategoryAction(raw: z.infer<typeof createCategorySchema>) {
  try {
    const user = await getSessionUser();
    const parsed = createCategorySchema.parse(raw);

    await db.insert(categories).values({
      userId: user.id,
      name: parsed.name,
      type: parsed.type,
      icon: parsed.icon,
      color: parsed.color,
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const user = await getSessionUser();

    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)));

    revalidatePath("/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category" };
  }
}
