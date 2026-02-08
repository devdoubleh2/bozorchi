import { QueryClient, MutationCache } from "@tanstack/react-query";

const FIVE_MINUTES = 1000 * 60 * 5;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: FIVE_MINUTES * 6, // 30 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry 4xx errors (client errors), only 5xx (server errors)
        const is4xx = error instanceof Error && error.message.includes("4");
        if (is4xx) return false;
        return failureCount < 3;
      },
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      // Invalidate all queries on successful mutation to ensure fresh data
      queryClient.invalidateQueries();
    },
  }),
});
