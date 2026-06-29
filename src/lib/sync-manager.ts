import { createTransactionAction, deleteTransactionAction } from "@/actions/transactions";
import { createAccountAction, deleteAccountAction } from "@/actions/accounts";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { createOrUpdateBudgetAction, deleteBudgetAction } from "@/actions/budgets";
import { getQueuedMutations, removeQueuedMutation, updateQueuedMutation, QueuedMutation } from "./indexed-db";

const MAX_RETRY_ATTEMPTS = 5;
let isProcessing = false;

export async function checkConnectivity(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const res = await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function executeMutation(op: QueuedMutation) {
  let result: { success: boolean; error?: string } = { success: false };

  switch (op.type) {
    case "CREATE_TRANSACTION":
      result = await createTransactionAction(op.data);
      break;
    case "DELETE_TRANSACTION":
      result = await deleteTransactionAction(op.data.id);
      break;
    case "CREATE_ACCOUNT":
      result = await createAccountAction(op.data);
      break;
    case "DELETE_ACCOUNT":
      result = await deleteAccountAction(op.data.id);
      break;
    case "CREATE_CATEGORY":
      result = await createCategoryAction(op.data);
      break;
    case "DELETE_CATEGORY":
      result = await deleteCategoryAction(op.data.id);
      break;
    case "CREATE_OR_UPDATE_BUDGET":
      result = await createOrUpdateBudgetAction(op.data);
      break;
    case "DELETE_BUDGET":
      result = await deleteBudgetAction(op.data.id);
      break;
    default:
      console.warn("Unknown sync operation type:", op.type);
      return;
  }

  if (!result.success) {
    throw new Error(result.error || "Server action execution failed");
  }
}

export async function processSyncQueue(queryClient?: any): Promise<void> {
  if (isProcessing) return;
  const isOnline = await checkConnectivity();
  if (!isOnline) return;

  isProcessing = true;
  try {
    const queue = await getQueuedMutations();
    if (queue.length === 0) return;

    // Sort chronologically to preserve order of operations
    queue.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of queue) {
      try {
        await executeMutation(op);
        await removeQueuedMutation(op.id);
      } catch (error: any) {
        console.error(`Sync operation ${op.type} (${op.id}) failed:`, error);

        if (op.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Discard dead letter to prevent blocking subsequent operations
          await removeQueuedMutation(op.id);
        } else {
          await updateQueuedMutation({
            ...op,
            retryCount: op.retryCount + 1,
            error: error.message || "Unknown error",
          });
          // Break sequence on failure to preserve causality
          break;
        }
      }
    }

    if (queryClient) {
      // Invalidate queries to get fresh server-rendered states
      queryClient.invalidateQueries();
    }
  } finally {
    isProcessing = false;
  }
}
