import { QueryClient, MutationCache } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
      retry: 3,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  })
});

