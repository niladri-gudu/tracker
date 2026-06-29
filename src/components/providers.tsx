"use client";

import { QueryClient, QueryClientProvider, QueryCache, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { setCacheItem, getCacheItem } from "@/lib/indexed-db";
import { processSyncQueue } from "@/lib/sync-manager";

const CACHE_KEYS_TO_HYDRATE = [
  "accounts",
  "categories",
  "dashboard-stats",
  "transactions",
  "budgets"
];

function OfflineHydratorAndSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function hydrate() {
      try {
        for (const key of CACHE_KEYS_TO_HYDRATE) {
          const cached = await getCacheItem(key);
          if (cached && cached.data) {
            queryClient.setQueryData([key], cached.data);
          }
        }
      } catch (err) {
        console.error("Hydrating query cache offline failed:", err);
      }
      
      // Process offline mutations queue on startup
      processSyncQueue(queryClient);
    }
    
    hydrate();

    const handleOnline = () => {
      processSyncQueue(queryClient);
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute cache duration
            refetchOnWindowFocus: false, // Prevent background refetch on focus
          },
        },
        queryCache: new QueryCache({
          onSuccess: (data, query) => {
            const key = query.queryKey[0];
            if (typeof key === "string" && CACHE_KEYS_TO_HYDRATE.includes(key)) {
              setCacheItem(key, { data, timestamp: Date.now() });
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineHydratorAndSync />
      {children}
    </QueryClientProvider>
  );
}
