"use server";

import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc, aliasedTable } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTransactionSchema = z.object({
  accountId: z.string().uuid("Invalid source account ID"),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid positive decimal number"),
  date: z.string().transform((val) => new Date(val)),
  description: z.string().max(100, "Description is too long").optional().nullable(),
  toAccountId: z.string().uuid("Invalid destination account ID").optional().nullable(),
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

const destAccounts = aliasedTable(accounts, "dest_accounts");

export async function getTransactionsAction(filters?: { accountId?: string }) {
  try {
    const user = await getSessionUser();

    const conditions = [eq(transactions.userId, user.id)];

    if (filters?.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }

    const list = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        accountId: transactions.accountId,
        accountName: accounts.name,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        toAccountId: transactions.toAccountId,
        toAccountName: destAccounts.name,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(destAccounts, eq(transactions.toAccountId, destAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch transactions" };
  }
}

export async function createTransactionAction(raw: z.input<typeof createTransactionSchema>) {
  try {
    const user = await getSessionUser();
    const parsed = createTransactionSchema.parse(raw);

    // Validate that the transfer source and destination accounts are different
    if (parsed.type === "transfer" && parsed.accountId === parsed.toAccountId) {
      return { success: false, error: "Source and destination accounts must be different" };
    }

    await db.transaction(async (tx) => {
      // 1. Fetch and validate source account
      const [sourceAcc] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, parsed.accountId), eq(accounts.userId, user.id)));
      if (!sourceAcc) throw new Error("Source account not found or access denied");
      const sourceBal = parseFloat(sourceAcc.balance);
      const amt = parseFloat(parsed.amount);

      // 2. Perform balance calculations
      if (parsed.type === "transfer") {
        if (!parsed.toAccountId) throw new Error("Destination account is required for transfers");
        
        const [destAcc] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, parsed.toAccountId), eq(accounts.userId, user.id)));
        if (!destAcc) throw new Error("Destination account not found or access denied");
        const destBal = parseFloat(destAcc.balance);

        // Deduct from source and add to destination
        await tx
          .update(accounts)
          .set({ balance: (sourceBal - amt).toFixed(2) })
          .where(eq(accounts.id, parsed.accountId));

        await tx
          .update(accounts)
          .set({ balance: (destBal + amt).toFixed(2) })
          .where(eq(accounts.id, parsed.toAccountId));
      } else if (parsed.type === "expense") {
        // Deduct expense from source
        await tx
          .update(accounts)
          .set({ balance: (sourceBal - amt).toFixed(2) })
          .where(eq(accounts.id, parsed.accountId));
      } else if (parsed.type === "income") {
        // Add income to source
        await tx
          .update(accounts)
          .set({ balance: (sourceBal + amt).toFixed(2) })
          .where(eq(accounts.id, parsed.accountId));
      }

      // 3. Log the transaction
      await tx.insert(transactions).values({
        userId: user.id,
        accountId: parsed.accountId,
        categoryId: parsed.categoryId || null,
        type: parsed.type,
        amount: parsed.amount,
        date: parsed.date,
        description: parsed.description || null,
        toAccountId: parsed.toAccountId || null,
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || "Failed to create transaction" };
  }
}

export async function deleteTransactionAction(transactionId: string) {
  try {
    const user = await getSessionUser();

    // Fetch transaction log to know its type/amount
    const [txLog] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)));
    if (!txLog) throw new Error("Transaction not found or access denied");

    const amt = parseFloat(txLog.amount);

    await db.transaction(async (tx) => {
      // 1. Revert source account balance
      const [sourceAcc] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, txLog.accountId));
      if (!sourceAcc) throw new Error("Source account not found");
      const sourceBal = parseFloat(sourceAcc.balance);

      let newSourceBal = sourceBal;
      if (txLog.type === "expense" || txLog.type === "transfer") {
        newSourceBal += amt; // Add back the deducted amount
      } else if (txLog.type === "income") {
        newSourceBal -= amt; // Deduct the added amount
      }

      await tx
        .update(accounts)
        .set({ balance: newSourceBal.toFixed(2) })
        .where(eq(accounts.id, txLog.accountId));

      // 2. Revert destination account balance if it was a transfer
      if (txLog.type === "transfer" && txLog.toAccountId) {
        const [destAcc] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, txLog.toAccountId));
        if (!destAcc) throw new Error("Destination account not found");
        const destBal = parseFloat(destAcc.balance);
        const newDestBal = destBal - amt; // Subtract the transferred amount

        await tx
          .update(accounts)
          .set({ balance: newDestBal.toFixed(2) })
          .where(eq(accounts.id, txLog.toAccountId));
      }

      // 3. Delete transaction log
      await tx.delete(transactions).where(eq(transactions.id, transactionId));
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete transaction" };
  }
}
