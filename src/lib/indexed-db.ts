export interface QueuedMutation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

const DB_NAME = "money-tracker-offline-db";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("query-cache")) {
        db.createObjectStore("query-cache");
      }
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "id" });
      }
    };
  });
}

export async function getCacheItem(key: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("query-cache", "readonly");
      const store = transaction.objectStore("query-cache");
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB getCacheItem failed:", err);
    return null;
  }
}

export async function setCacheItem(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("query-cache", "readwrite");
      const store = transaction.objectStore("query-cache");
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB setCacheItem failed:", err);
  }
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, "id" | "retryCount">): Promise<string> {
  const id = crypto.randomUUID();
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("sync-queue", "readwrite");
      const store = transaction.objectStore("sync-queue");
      const request = store.add({ ...mutation, id, retryCount: 0 });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return id;
  } catch (err) {
    console.error("IndexedDB enqueueMutation failed:", err);
    throw err;
  }
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("sync-queue", "readonly");
      const store = transaction.objectStore("sync-queue");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB getQueuedMutations failed:", err);
    return [];
  }
}

export async function removeQueuedMutation(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("sync-queue", "readwrite");
      const store = transaction.objectStore("sync-queue");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB removeQueuedMutation failed:", err);
  }
}

export async function updateQueuedMutation(mutation: QueuedMutation): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("sync-queue", "readwrite");
      const store = transaction.objectStore("sync-queue");
      const request = store.put(mutation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB updateQueuedMutation failed:", err);
  }
}
