// Re-export all types from shared package
export * from "@bozorchi/shared";

export interface TransactionsResponse {
    transactions: TransactionWithDetails[];
    pagination?: {
        total: number;
        limit: number;
        page?: number;
        pages?: number;
        offset?: number;
        hasMore?: boolean;
    };
}

// Auth & Custom Types

/** User's active store info */
export interface UserStoreInfo {
    userId: string;
    storeId: string;
    role: "admin" | "user";
    approved: boolean;
    store: Store;
}

/** User's store assignment */
export interface UserStore {
    id: string;
    userId: string;
    storeId: string;
    role: "admin" | "user";
    approved: boolean;
}

/** Staff assignment response */
export interface StaffAssignment {
    id: string;
    user_id: string;
    organization_id: string;
    store_id: string | null;
    role: "admin" | "user";
    approved: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

/** Staff assignments response from API */
export interface StaffAssignmentsResponse {
    pending: StaffAssignment[];
    approved: StaffAssignment[];
}

/** Registration payload for creating a new user */
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';

    // Admin fields (required when role = 'admin')
    organization_name?: string;
    store_name?: string;
    address?: string;
    phone?: string;
    currency?: string;

    // User fields (required when role = 'user')
    store_id?: string;
}

/** Dashboard Stats Response from /api/transactions/stats */
export interface DashboardStats {
    // Main stat cards
    totalIn: number;
    totalOut: number;
    profit: number;
    supplierCost: number;
    totalReturn: number;

    // Detailed stats
    transactionCount: number;
    totalItemsSold: number;
    avgOrderValue: number;
    profitMargin: number;

    // Breakdown by transaction type
    byType: Record<string, { amount: number; count: number; quantity: number }>;

    // Transfer store information for legends
    transferStores: Record<string, { sourceStore?: string; targetStore?: string }>;

    // Chart data
    dailyBreakdown: { date: string; revenue: number; purchases: number; cogs: number }[];
    dailyByType: { date: string;[key: string]: string | number }[];
    topProductsByRevenue: { name: string; revenue: number }[];
    topProductsByQuantity: { name: string; quantity: number }[];
}
