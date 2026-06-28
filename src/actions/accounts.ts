"use server";

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50, "Name is too long"),
  type: z.enum(["cash", "bank", "investment"]),
  balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Invalid balance amount"),
  currency: z.string().min(3).max(3).default("INR"),
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

export async function getAccountsAction() {
  try {
    const user = await getSessionUser();
    const list = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id));
    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch accounts" };
  }
}

export async function createAccountAction(raw: z.infer<typeof createAccountSchema>) {
  try {
    const user = await getSessionUser();
    const parsed = createAccountSchema.parse(raw);

    await db.insert(accounts).values({
      userId: user.id,
      name: parsed.name,
      type: parsed.type,
      balance: parsed.balance,
      currency: parsed.currency,
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || "Failed to create account" };
  }
}

export async function deleteAccountAction(accountId: string) {
  try {
    const user = await getSessionUser();

    await db
      .delete(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)));

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete account" };
  }
}
