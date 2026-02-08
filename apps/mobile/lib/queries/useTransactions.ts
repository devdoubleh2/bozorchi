import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

// Fetch recent transactions
export const useTransactions = (params?: Record<string, unknown>) => {
    return useQuery({
        queryKey: ["transactions", params],
        queryFn: async () => {
            const queryString = params
                ? "?" + new URLSearchParams(
                    Object.entries(params).reduce((acc, [key, value]) => ({
                        ...acc,
                        [key]: String(value)
                    }), {} as Record<string, string>)
                ).toString()
                : "";
            const response = await api.get<Array<Record<string, unknown>>>(`/transactions${queryString}`);
            return response;
        },
    });
};

// Create transaction - mobile currently uses API directly
export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transactionData: { items: unknown[]; payments: unknown[]; total_amount: number; currency: string; store_id?: string }) => {
            const response = await api.post<Record<string, unknown>>("/transactions", transactionData);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
};

