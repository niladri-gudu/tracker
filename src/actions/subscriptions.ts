"use server";

import { db } from "@/db";
import { accounts, categories, transactions, subscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid positive decimal number"),
  type: z.enum(["income", "expense"]),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.string().transform((val) => new Date(val)),
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

export async function getSubscriptionsAction() {
  try {
    const user = await getSessionUser();
    
    // Fetch all user subscriptions joined with categories/accounts
    const data = await db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        amount: subscriptions.amount,
        type: subscriptions.type,
        frequency: subscriptions.frequency,
        startDate: subscriptions.startDate,
        nextDueDate: subscriptions.nextDueDate,
        isActive: subscriptions.isActive,
        accountId: subscriptions.accountId,
        accountName: accounts.name,
        categoryId: subscriptions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(subscriptions)
      .innerJoin(accounts, eq(subscriptions.accountId, accounts.id))
      .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.nextDueDate));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load subscriptions" };
  }
}

export async function createSubscriptionAction(formData: z.input<typeof createSubscriptionSchema>) {
  try {
    const user = await getSessionUser();
    const parsed = createSubscriptionSchema.parse(formData);

    // Initial next due date is start date
    const nextDueDate = new Date(parsed.startDate);

    const [newSub] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        accountId: parsed.accountId,
        categoryId: parsed.categoryId,
        name: parsed.name,
        amount: parsed.amount,
        type: parsed.type,
        frequency: parsed.frequency,
        startDate: parsed.startDate,
        nextDueDate: nextDueDate,
        isActive: true,
      })
      .returning();

    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return { success: true, data: newSub };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create subscription" };
  }
}

export async function deleteSubscriptionAction(id: string) {
  try {
    const user = await getSessionUser();

    await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)));

    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete subscription" };
  }
}

function getNextOccurrence(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

export async function triggerSubscriptionPaymentAction(id: string) {
  try {
    const user = await getSessionUser();

    await db.transaction(async (tx) => {
      // 1. Fetch the subscription
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)));

      if (!sub) throw new Error("Subscription not found");
      if (!sub.isActive) throw new Error("Subscription is inactive");

      // 2. Fetch linked account
      const [acc] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, sub.accountId), eq(accounts.userId, user.id)));

      if (!acc) throw new Error("Account not found");

      const amt = parseFloat(sub.amount);

      // 3. Update account balance
      const currentBalance = parseFloat(acc.balance);
      const newBalance = sub.type === "expense" ? currentBalance - amt : currentBalance + amt;

      await tx
        .update(accounts)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(accounts.id, acc.id));

      // 4. Log the transaction in ledger
      // Store at UTC Noon to prevent timezone shifting
      const logDate = new Date(sub.nextDueDate);
      logDate.setUTCHours(12, 0, 0, 0);

      await tx.insert(transactions).values({
        userId: user.id,
        accountId: sub.accountId,
        categoryId: sub.categoryId,
        type: sub.type,
        amount: sub.amount,
        date: logDate,
        description: `Recurring Payment: ${sub.name}`,
        isCleared: true,
      });

      // 5. Advance the next due date
      const nextDue = getNextOccurrence(sub.nextDueDate, sub.frequency);
      await tx
        .update(subscriptions)
        .set({ nextDueDate: nextDue, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    });

    revalidatePath("/subscriptions");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to trigger recurring payment" };
  }
}
