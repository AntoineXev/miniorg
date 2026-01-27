"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a singleton queryClient that can be accessed from outside React
let queryClientInstance: QueryClient | null = null;

function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
          refetchOnWindowFocus: true,
          retry: 1,
        },
        mutations: {
          onError: (error) => {
            console.error("Mutation error:", error);
          },
        },
      },
    });
  }
  return queryClientInstance;
}

/**
 * Clear all cached queries (useful on logout)
 */
export function clearQueryCache() {
  if (queryClientInstance) {
    queryClientInstance.clear();
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
