"use server";

import { db } from "@/db";
import { accounts, budgets, categories, transactions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc, gte, aliasedTable } from "drizzle-orm";
import { headers } from "next/headers";
import { getCategorySpentAmounts } from "./budgets";

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

export async function getDashboardStatsAction() {
  try {
    const user = await getSessionUser();

    // 1. Fetch user accounts & calculate net worth
    const accountsList = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id));

    const totalBalance = accountsList.reduce((acc, curr) => {
      const val = parseFloat(curr.balance);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    // 2. Fetch monthly transactions & calculate inflow/outflow
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          gte(transactions.date, startOfMonth)
        )
      );

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    monthlyTxs.forEach((tx) => {
      const amt = parseFloat(tx.amount);
      if (isNaN(amt)) return;
      if (tx.type === "income") {
        monthlyIncome += amt;
      } else if (tx.type === "expense") {
        monthlyExpense += amt;
      }
    });

    // 3. Fetch active budgets and details
    const budgetsList = await db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        limitAmount: budgets.limitAmount,
      })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.startDate, startOfMonth)
        )
      );

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id));
    const categoriesMap = new Map(userCategories.map(c => [c.id, c]));

    const spentMap = await getCategorySpentAmounts(user.id, startOfMonth);

    const budgetsDetails = budgetsList
      .map((b) => {
        const cat = categoriesMap.get(b.categoryId);
        if (!cat) return null;
        const spent = spentMap[b.categoryId] || 0;
        return {
          id: b.id,
          categoryId: b.categoryId,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          limitAmount: parseFloat(b.limitAmount),
          spentAmount: spent,
        };
      })
      .filter((b) => b !== null) as Array<{
        id: string;
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        limitAmount: number;
        spentAmount: number;
      }>;

    // 4. Fetch top 5 recent transactions
    const recent = await db
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
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.date))
      .limit(5);

    return {
      success: true,
      data: {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        activeBudgetsCount: budgetsList.length,
        recentTransactions: recent,
        budgetsDetails,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch dashboard stats" };
  }
}
