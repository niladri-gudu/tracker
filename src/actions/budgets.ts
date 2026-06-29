"use server";

import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const setBudgetSchema = z.object({
  categoryId: z.string().uuid("Invalid category identification"),
  limitAmount: z.string().min(1, "Budget limit is required"),
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

export async function getCurrentMonthBounds() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

export async function getCategorySpentAmounts(userId: string, startDate: Date) {
  const monthlyTxs = await db
    .select({
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate)
      )
    );

  const spentMap: Record<string, number> = {};
  monthlyTxs.forEach((tx) => {
    if (tx.type === "expense" && tx.categoryId) {
      const amt = parseFloat(tx.amount);
      if (!isNaN(amt)) {
        spentMap[tx.categoryId] = (spentMap[tx.categoryId] || 0) + amt;
      }
    }
  });
  return spentMap;
}

export async function getBudgetsAction() {
  try {
    const user = await getSessionUser();
    const { startDate } = await getCurrentMonthBounds();

    const budgetsList = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.startDate, startDate)
        )
      );

    const spentMap = await getCategorySpentAmounts(user.id, startDate);

    const data = budgetsList.map((b) => ({
      ...b,
      spentAmount: spentMap[b.categoryId] || 0,
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch budgets" };
  }
}

export async function createOrUpdateBudgetAction(raw: z.infer<typeof setBudgetSchema>) {
  try {
    const user = await getSessionUser();
    const parsed = setBudgetSchema.parse(raw);
    const { startDate, endDate } = await getCurrentMonthBounds();
    const limit = parseFloat(parsed.limitAmount);
    if (isNaN(limit) || limit <= 0) {
      throw new Error("Invalid budget limit amount");
    }

    // Check if budget already exists for this category and current month cycle
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.categoryId, parsed.categoryId),
          eq(budgets.startDate, startDate)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(budgets)
        .set({ limitAmount: limit.toFixed(2) })
        .where(eq(budgets.id, existing[0].id));
    } else {
      // Create
      await db.insert(budgets).values({
        userId: user.id,
        categoryId: parsed.categoryId,
        limitAmount: limit.toFixed(2),
        startDate,
        endDate,
      });
    }

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || "Failed to set budget" };
  }
}

export async function deleteBudgetAction(budgetId: string) {
  try {
    const user = await getSessionUser();

    await db
      .delete(budgets)
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, user.id)));

    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete budget" };
  }
}
