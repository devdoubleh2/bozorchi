import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BulkUpdateItem {
    productId: string;
    variationId: string;
    productImageUrl?: string | null;
    variationImageUrl?: string | null;
    productCategoryId?: string | null;
    sellingPrice?: number;
    price?: number;
    supplierId?: string | null;
    unitId?: string | null;
}

export interface BulkUpdatePayload {
    items: BulkUpdateItem[];
}

export const useInventoryMutations = () => {
    const queryClient = useQueryClient();

    const deleteProduct = useMutation({
        mutationKey: ["delete-product"],
        mutationFn: (productId: string) => api.delete(`/api/products/${productId}`),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const previousInventory = queryClient.getQueryData(["products"]);

            // Optimistic delete could be complex due to flattening, so we skip complex logic
            // and rely on invalidation or simple filtering if needed. 
            // For now, invalidation is safer.

            return { previousInventory };
        },
        onError: (_err, _newTodo, context) => {
            if (context?.previousInventory) {
                queryClient.setQueryData(["products"], context.previousInventory);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const bulkUpdateProducts = useMutation({
        mutationKey: ["bulk-update-products"],
        mutationFn: async (payload: BulkUpdatePayload) => {
            return api.put<{ message: string; productsUpdated: number; variationsUpdated: number }>(
                "/api/products/bulk-update",
                payload
            );
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const previousInventory = queryClient.getQueryData(["products"]);
            return { previousInventory };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousInventory) {
                queryClient.setQueryData(["products"], context.previousInventory);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
        },
    });

    const bulkDeleteProducts = useMutation({
        mutationKey: ["bulk-delete-products"],
        mutationFn: async (productIds: string[]) => {
            return api.delete<{ message: string; productsDeleted: number }>(
                "/api/products/bulk",
                { ids: productIds }
            );
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const previousInventory = queryClient.getQueryData(["products"]);
            return { previousInventory };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousInventory) {
                queryClient.setQueryData(["products"], context.previousInventory);
            }
        },
        onSettled: () => {
            // Invalidate all product-related queries including those with store-specific keys
            void queryClient.invalidateQueries({ queryKey: ["products"], type: "all" });
            void queryClient.invalidateQueries({ queryKey: ["inventory"], type: "all" });
        },
    });

    return {
        deleteProduct,
        bulkUpdateProducts,
        bulkDeleteProducts,
    };
};
