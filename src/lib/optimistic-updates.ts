import { QueryClient } from "@tanstack/react-query";

// 1. Transactions Cache Modifiers
export function optimisticCreateTransaction(
  queryClient: QueryClient,
  tx: any,
  accountsList: any[],
  categoriesList: any[]
) {
  const amount = parseFloat(tx.amount);
  if (isNaN(amount)) return;

  const targetAccount = accountsList.find((a) => a.id === tx.accountId);
  const accountName = targetAccount?.name || "";
  const targetCategory = categoriesList.find((c) => c.id === tx.categoryId);
  const categoryName = targetCategory?.name || "";
  const categoryColor = targetCategory?.color || "";
  const categoryIcon = targetCategory?.icon || "";

  const tempId = crypto.randomUUID();

  // A. Update transactions list
  queryClient.setQueryData(["transactions"], (old: any) => {
    const list = old || [];
    const newTx = {
      id: tempId,
      type: tx.type,
      amount: tx.amount,
      date: new Date(tx.date),
      description: tx.description || "",
      accountId: tx.accountId,
      accountName,
      categoryId: tx.categoryId || null,
      categoryName,
      categoryColor,
      categoryIcon,
      toAccountId: tx.toAccountId || null,
      toAccountName: tx.toAccountId ? (accountsList.find((a) => a.id === tx.toAccountId)?.name || "") : null,
      _syncStatus: "pending",
    };
    return [newTx, ...list];
  });

  // B. Update accounts balances
  queryClient.setQueryData(["accounts"], (old: any) => {
    if (!old) return old;
    return old.map((acc: any) => {
      if (acc.id === tx.accountId) {
        const bal = parseFloat(acc.balance);
        const newBal = tx.type === "expense" ? bal - amount : tx.type === "income" ? bal + amount : bal - amount;
        return { ...acc, balance: newBal.toFixed(2) };
      }
      if (tx.type === "transfer" && acc.id === tx.toAccountId) {
        const bal = parseFloat(acc.balance);
        return { ...acc, balance: (bal + amount).toFixed(2) };
      }
      return acc;
    });
  });

  // C. Update Dashboard Stats (Total, Monthly stats, Recent list, active budgets progress)
  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;

    let balanceDiff = 0;
    let incomeDiff = 0;
    let expenseDiff = 0;

    if (tx.type === "income") {
      balanceDiff = amount;
      incomeDiff = amount;
    } else if (tx.type === "expense") {
      balanceDiff = -amount;
      expenseDiff = amount;
    }

    const newRecent = {
      id: tempId,
      type: tx.type,
      amount: tx.amount,
      date: new Date(tx.date),
      description: tx.description || "",
      accountId: tx.accountId,
      accountName,
      categoryId: tx.categoryId || null,
      categoryName,
      categoryColor,
      categoryIcon,
      toAccountId: tx.toAccountId || null,
      toAccountName: tx.toAccountId ? (accountsList.find((a) => a.id === tx.toAccountId)?.name || "") : null,
    };

    const recent = [newRecent, ...(old.recentTransactions || [])].slice(0, 5);

    let budgetsDetails = old.budgetsDetails || [];
    if (tx.type === "expense" && tx.categoryId) {
      budgetsDetails = budgetsDetails.map((b: any) => {
        if (b.categoryId === tx.categoryId) {
          return { ...b, spentAmount: b.spentAmount + amount };
        }
        return b;
      });
    }

    return {
      ...old,
      totalBalance: old.totalBalance + balanceDiff,
      monthlyIncome: old.monthlyIncome + incomeDiff,
      monthlyExpense: old.monthlyExpense + expenseDiff,
      recentTransactions: recent,
      budgetsDetails,
    };
  });
}

export function optimisticDeleteTransaction(queryClient: QueryClient, id: string) {
  // A. Retrieve transaction details from cache to calculate balance reverts
  const transactionsList = queryClient.getQueryData(["transactions"]) as any[] || [];
  const targetTx = transactionsList.find((t) => t.id === id);
  if (!targetTx) return;

  const amount = parseFloat(targetTx.amount);
  if (isNaN(amount)) return;

  // B. Remove from transactions list
  queryClient.setQueryData(["transactions"], (old: any) => {
    if (!old) return old;
    return old.filter((t: any) => t.id !== id);
  });

  // C. Revert account balance adjustments
  queryClient.setQueryData(["accounts"], (old: any) => {
    if (!old) return old;
    return old.map((acc: any) => {
      if (acc.id === targetTx.accountId) {
        const bal = parseFloat(acc.balance);
        const newBal = targetTx.type === "expense" ? bal + amount : targetTx.type === "income" ? bal - amount : bal + amount;
        return { ...acc, balance: newBal.toFixed(2) };
      }
      if (targetTx.type === "transfer" && acc.id === targetTx.toAccountId) {
        const bal = parseFloat(acc.balance);
        return { ...acc, balance: (bal - amount).toFixed(2) };
      }
      return acc;
    });
  });

  // D. Update Dashboard stats
  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;

    let balanceDiff = 0;
    let incomeDiff = 0;
    let expenseDiff = 0;

    if (targetTx.type === "income") {
      balanceDiff = -amount;
      incomeDiff = -amount;
    } else if (targetTx.type === "expense") {
      balanceDiff = amount;
      expenseDiff = -amount;
    }

    const recent = (old.recentTransactions || []).filter((t: any) => t.id !== id);

    let budgetsDetails = old.budgetsDetails || [];
    if (targetTx.type === "expense" && targetTx.categoryId) {
      budgetsDetails = budgetsDetails.map((b: any) => {
        if (b.categoryId === targetTx.categoryId) {
          return { ...b, spentAmount: Math.max(0, b.spentAmount - amount) };
        }
        return b;
      });
    }

    return {
      ...old,
      totalBalance: old.totalBalance + balanceDiff,
      monthlyIncome: old.monthlyIncome + incomeDiff,
      monthlyExpense: old.monthlyExpense + expenseDiff,
      recentTransactions: recent,
      budgetsDetails,
    };
  });
}

// 2. Accounts Cache Modifiers
export function optimisticCreateAccount(queryClient: QueryClient, acc: any) {
  const amount = parseFloat(acc.balance) || 0;
  const tempId = crypto.randomUUID();

  queryClient.setQueryData(["accounts"], (old: any) => {
    const list = old || [];
    const newAcc = {
      id: tempId,
      name: acc.name,
      type: acc.type,
      balance: amount.toFixed(2),
      _syncStatus: "pending",
    };
    return [...list, newAcc];
  });

  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      totalBalance: old.totalBalance + amount,
    };
  });
}

export function optimisticDeleteAccount(queryClient: QueryClient, id: string) {
  const accountsList = queryClient.getQueryData(["accounts"]) as any[] || [];
  const targetAcc = accountsList.find((a) => a.id === id);
  if (!targetAcc) return;

  const amount = parseFloat(targetAcc.balance) || 0;

  queryClient.setQueryData(["accounts"], (old: any) => {
    if (!old) return old;
    return old.filter((a: any) => a.id !== id);
  });

  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      totalBalance: Math.max(0, old.totalBalance - amount),
    };
  });
}

// 3. Categories Cache Modifiers
export function optimisticCreateCategory(queryClient: QueryClient, cat: any) {
  const tempId = crypto.randomUUID();

  queryClient.setQueryData(["categories"], (old: any) => {
    const list = old || [];
    const newCat = {
      id: tempId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      _syncStatus: "pending",
    };
    return [...list, newCat];
  });
}

export function optimisticDeleteCategory(queryClient: QueryClient, id: string) {
  queryClient.setQueryData(["categories"], (old: any) => {
    if (!old) return old;
    return old.filter((c: any) => c.id !== id);
  });
}

// 4. Budgets Cache Modifiers
export function optimisticCreateOrUpdateBudget(queryClient: QueryClient, budget: any, categoriesList: any[]) {
  const limit = parseFloat(budget.limitAmount);
  if (isNaN(limit)) return;

  const tempId = crypto.randomUUID();
  const cat = categoriesList.find((c) => c.id === budget.categoryId);
  const categoryName = cat?.name || "";
  const categoryColor = cat?.color || "";
  const categoryIcon = cat?.icon || "";

  // A. Update budgets list query cache
  queryClient.setQueryData(["budgets"], (old: any) => {
    const list = old || [];
    const existingIdx = list.findIndex((b: any) => b.categoryId === budget.categoryId);

    if (existingIdx > -1) {
      const updatedList = [...list];
      updatedList[existingIdx] = { ...updatedList[existingIdx], limitAmount: limit.toFixed(2) };
      return updatedList;
    } else {
      const newBudget = {
        id: tempId,
        categoryId: budget.categoryId,
        limitAmount: limit.toFixed(2),
        spentAmount: 0,
        _syncStatus: "pending",
      };
      return [...list, newBudget];
    }
  });

  // B. Update dashboard constraints list
  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;

    const details = old.budgetsDetails || [];
    const existingIdx = details.findIndex((b: any) => b.categoryId === budget.categoryId);

    let updatedDetails = [...details];
    if (existingIdx > -1) {
      updatedDetails[existingIdx] = { ...updatedDetails[existingIdx], limitAmount: limit };
    } else {
      updatedDetails.push({
        id: tempId,
        categoryId: budget.categoryId,
        categoryName,
        categoryIcon,
        categoryColor,
        limitAmount: limit,
        spentAmount: 0,
      });
    }

    return {
      ...old,
      activeBudgetsCount: updatedDetails.length,
      budgetsDetails: updatedDetails,
    };
  });
}

export function optimisticDeleteBudget(queryClient: QueryClient, id: string) {
  const budgetsList = queryClient.getQueryData(["budgets"]) as any[] || [];
  const targetBudget = budgetsList.find((b) => b.id === id);
  if (!targetBudget) return;

  // A. Remove from budgets list cache
  queryClient.setQueryData(["budgets"], (old: any) => {
    if (!old) return old;
    return old.filter((b: any) => b.id !== id);
  });

  // B. Remove from dashboard details
  queryClient.setQueryData(["dashboard-stats"], (old: any) => {
    if (!old) return old;
    const details = (old.budgetsDetails || []).filter((b: any) => b.id !== id);
    return {
      ...old,
      activeBudgetsCount: details.length,
      budgetsDetails: details,
    };
  });
}
