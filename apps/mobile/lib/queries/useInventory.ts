import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

// Basic API fetch for inventory
export const useInventory = (storeId: string) => {
    return useQuery({
        queryKey: ["inventory", storeId],
        queryFn: async () => {
            const response = await api.get<{ product_variation_id: string;[key: string]: unknown }[]>(`/stores/${storeId}/inventory`);
            return response;
        },
    });
};

