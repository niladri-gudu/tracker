"use server";

import { db } from "@/db";
import { accounts, transactions, savingsGoals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid positive decimal number"),
  targetDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
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

export async function getGoalsAction() {
  try {
    const user = await getSessionUser();
    
    const data = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, user.id))
      .orderBy(desc(savingsGoals.createdAt));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load goals" };
  }
}

export async function createGoalAction(formData: z.input<typeof createGoalSchema>) {
  try {
    const user = await getSessionUser();
    const parsed = createGoalSchema.parse(formData);

    const [newGoal] = await db
      .insert(savingsGoals)
      .values({
        userId: user.id,
        name: parsed.name,
        targetAmount: parsed.targetAmount,
        currentAmount: "0.00",
        targetDate: parsed.targetDate,
      })
      .returning();

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true, data: newGoal };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create goal" };
  }
}

export async function deleteGoalAction(id: string) {
  try {
    const user = await getSessionUser();

    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)));

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete goal" };
  }
}

export async function adjustGoalFundsAction(
  goalId: string,
  accountId: string,
  amountStr: string,
  actionType: "add" | "withdraw"
) {
  try {
    const user = await getSessionUser();
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) {
      throw new Error("Invalid amount");
    }

    await db.transaction(async (tx) => {
      // 1. Fetch the goal
      const [goal] = await tx
        .select()
        .from(savingsGoals)
        .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, user.id)));

      if (!goal) throw new Error("Goal not found");

      // 2. Fetch the account
      const [acc] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)));

      if (!acc) throw new Error("Account not found");

      const currentGoalAmt = parseFloat(goal.currentAmount);
      const currentAccBal = parseFloat(acc.balance);

      let newGoalAmt = currentGoalAmt;
      let newAccBal = currentAccBal;
      let txType: "expense" | "income" = "expense";
      let txDesc = "";

      if (actionType === "add") {
        if (currentAccBal < amt) {
          throw new Error("Insufficient funds in selected account");
        }
        newGoalAmt = currentGoalAmt + amt;
        newAccBal = currentAccBal - amt;
        txType = "expense";
        txDesc = `Goal Allocation: ${goal.name}`;
      } else {
        if (currentGoalAmt < amt) {
          throw new Error("Insufficient funds in savings goal");
        }
        newGoalAmt = currentGoalAmt - amt;
        newAccBal = currentAccBal + amt;
        txType = "income";
        txDesc = `Goal Withdrawal: ${goal.name}`;
      }

      // 3. Update account balance
      await tx
        .update(accounts)
        .set({ balance: newAccBal.toFixed(2) })
        .where(eq(accounts.id, acc.id));

      // 4. Update goal current amount
      await tx
        .update(savingsGoals)
        .set({ currentAmount: newGoalAmt.toFixed(2), updatedAt: new Date() })
        .where(eq(savingsGoals.id, goal.id));

      // 5. Log transaction record (UTC Noon to keep timezone-stable)
      const logDate = new Date();
      logDate.setUTCHours(12, 0, 0, 0);

      await tx.insert(transactions).values({
        userId: user.id,
        accountId: acc.id,
        categoryId: null, // Virtual transfer, no category
        type: txType,
        amount: amt.toFixed(2),
        date: logDate,
        description: txDesc,
        isCleared: true,
      });
    });

    revalidatePath("/goals");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to adjust funds" };
  }
}
