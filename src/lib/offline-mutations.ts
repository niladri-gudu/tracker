import { QueryClient } from "@tanstack/react-query";
import { checkConnectivity } from "./sync-manager";
import { enqueueMutation } from "./indexed-db";
import {
  optimisticCreateTransaction,
  optimisticDeleteTransaction,
  optimisticCreateAccount,
  optimisticDeleteAccount,
  optimisticCreateCategory,
  optimisticDeleteCategory,
  optimisticCreateOrUpdateBudget,
  optimisticDeleteBudget
} from "./optimistic-updates";

// Server actions
import { createTransactionAction, deleteTransactionAction } from "@/actions/transactions";
import { createAccountAction, deleteAccountAction } from "@/actions/accounts";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { createOrUpdateBudgetAction, deleteBudgetAction } from "@/actions/budgets";

// 1. Transaction mutations
export async function executeCreateTransaction(
  queryClient: QueryClient,
  raw: any,
  accountsList: any[],
  categoriesList: any[]
) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await createTransactionAction(raw);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "CREATE_TRANSACTION",
      data: raw,
      timestamp: Date.now(),
    });
    optimisticCreateTransaction(queryClient, raw, accountsList, categoriesList);
    return { success: true, offline: true };
  }
}

export async function executeDeleteTransaction(queryClient: QueryClient, id: string) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await deleteTransactionAction(id);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "DELETE_TRANSACTION",
      data: { id },
      timestamp: Date.now(),
    });
    optimisticDeleteTransaction(queryClient, id);
    return { success: true, offline: true };
  }
}

// 2. Account mutations
export async function executeCreateAccount(queryClient: QueryClient, raw: any) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await createAccountAction(raw);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "CREATE_ACCOUNT",
      data: raw,
      timestamp: Date.now(),
    });
    optimisticCreateAccount(queryClient, raw);
    return { success: true, offline: true };
  }
}

export async function executeDeleteAccount(queryClient: QueryClient, id: string) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await deleteAccountAction(id);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "DELETE_ACCOUNT",
      data: { id },
      timestamp: Date.now(),
    });
    optimisticDeleteAccount(queryClient, id);
    return { success: true, offline: true };
  }
}

// 3. Category mutations
export async function executeCreateCategory(queryClient: QueryClient, raw: any) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await createCategoryAction(raw);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "CREATE_CATEGORY",
      data: raw,
      timestamp: Date.now(),
    });
    optimisticCreateCategory(queryClient, raw);
    return { success: true, offline: true };
  }
}

export async function executeDeleteCategory(queryClient: QueryClient, id: string) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await deleteCategoryAction(id);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "DELETE_CATEGORY",
      data: { id },
      timestamp: Date.now(),
    });
    optimisticDeleteCategory(queryClient, id);
    return { success: true, offline: true };
  }
}

// 4. Budget mutations
export async function executeCreateOrUpdateBudget(queryClient: QueryClient, raw: any, categoriesList: any[]) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await createOrUpdateBudgetAction(raw);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "CREATE_OR_UPDATE_BUDGET",
      data: raw,
      timestamp: Date.now(),
    });
    optimisticCreateOrUpdateBudget(queryClient, raw, categoriesList);
    return { success: true, offline: true };
  }
}

export async function executeDeleteBudget(queryClient: QueryClient, id: string) {
  const isOnline = await checkConnectivity();
  if (isOnline) {
    const res = await deleteBudgetAction(id);
    if (res.success) {
      queryClient.invalidateQueries();
    }
    return res;
  } else {
    await enqueueMutation({
      type: "DELETE_BUDGET",
      data: { id },
      timestamp: Date.now(),
    });
    optimisticDeleteBudget(queryClient, id);
    return { success: true, offline: true };
  }
}
