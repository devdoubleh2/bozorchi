import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
// import type { TransactionWithDetails } from "@/pages/Transactions";

type CreateTransactionParams = {
    product_variation_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    transaction_type: string;
    store_id?: string;
    remarks?: string;
    customer_id?: string;
    __skipInvalidation?: boolean;
};

type ReturnTransactionParams = {
    id: string;
    quantity?: number;
};

type ExchangeTransactionParams = {
    id: string;
    returnQuantity: number;
    newProductVariationId: string;
    newQuantity: number;
};

type RepaymentParams = {
    customerId: string;
    amount: number;
    storeId?: string;
};

export const useTransactionMutations = () => {
    const queryClient = useQueryClient();

    const createTransaction = useMutation({
        mutationKey: ["create-transaction"],
        mutationFn: (data: CreateTransactionParams) => {
            const { __skipInvalidation, ...payload } = data;
            return api.post("/api/transactions", payload);
        },
        onMutate: async () => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["transactions"] });

            // Snapshot the previous value
            const previousTransactions = queryClient.getQueryData(["transactions"]);

            // Optimistically update to the new value
            // Note: This is a complex optimistic update because the list is paginated and filtered.
            // For now, we will relying on invalidation for the list, 
            // but we could implement basic list addition if critical.
            // Given the complexity of filters (date, type, etc.), simple invalidation is safer for consistency
            // UNLESS we are strictly offline.

            return { previousTransactions };
        },
        onError: (_err, _newTodo, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousTransactions) {
                queryClient.setQueryData(["transactions"], context.previousTransactions);
            }
        },
        onSettled: (_data, _error, variables) => {
            if (variables?.__skipInvalidation) {
                return;
            }

            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
            // Also invalidate inventory since quantity changed
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });

    const deleteTransaction = useMutation({
        mutationKey: ["delete-transaction"],
        mutationFn: (id: string) => api.delete(`/api/transactions/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["transactions"] });
            const previousTransactions = queryClient.getQueryData(["transactions"]);

            // Optimistic delete
            // We can try to remove it from the cached pages
            queryClient.setQueriesData({ queryKey: ["transactions"] }, (old: any) => {
                if (!old || !old.transactions) return old;
                return {
                    ...old,
                    transactions: old.transactions.filter((t: any) => t.id !== id && !t.items?.some((i: any) => i.id === id))
                };
            });

            return { previousTransactions };
        },
        onError: (_err, _id, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(["transactions"], context.previousTransactions);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
        },
    });

    const returnTransaction = useMutation({
        mutationKey: ["return-transaction"],
        mutationFn: ({ id, quantity }: ReturnTransactionParams) => {
            const body = quantity ? { quantity } : undefined;
            return api.post(`/api/transactions/${id}/return`, body);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });

    const exchangeTransaction = useMutation({
        mutationFn: ({ id, ...body }: ExchangeTransactionParams) =>
            api.post(`/api/transactions/${id}/exchange`, body),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });

    const repaymentTransaction = useMutation({
        mutationFn: (data: RepaymentParams) =>
            api.post("/api/transactions/debt-repayment", data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
        }
    });

    return {
        createTransaction,
        deleteTransaction,
        returnTransaction,
        exchangeTransaction,
        repaymentTransaction
    };
};
