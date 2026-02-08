// Custom types mapping to API responses and Database entities
// Using snake_case to match API/DB structures as expected by the mobile app code

import {
    TransactionType,
    ProductType,
    PaymentMethod,
    WriteOffReason,
} from "./generated/tenant/enums";

// Re-export specific enums that are working
export {
    TransactionType,
    ProductType,
    PaymentMethod,
    WriteOffReason,
};

// Manually defined types to ensure structural correctness

export interface Unit {
    id: string;
    name: string;
    abbreviation: string;
    created_at: Date | string;
    updated_at: Date | string;
    store_id: string;
}

export interface Store {
    id: string;
    name: string;
    organization_id: string;
    currency: string | null;
    loyalty_cashback_percentage: number;
    address: string | null;
    phone: string | null;
    transaction_view_limit_days: number;
    subscription_status: string | null;
    category_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface ProductCategory {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    store_id: string | null;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    organization_id: string;
    store_id: string | null;
}

export interface ProductVariation {
    id: string;
    name: string;
    price: number;
    created_at: Date | string;
    updated_at: Date | string;
    product_id: string;
}

export interface Inventory {
    id: string;
    product_variation_id: string;
    store_id: string;
    quantity: number;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    store_id: string;
}

export interface Supplier {
    id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    store_id: string;
}

export interface Transaction {
    id: string;
    product_variation_id: string | null;
    quantity: number;
    selling_price: number;
    delivery_cost: number;
    unit_price: number;
    total_amount: number;
    transaction_type: TransactionType;
    transaction_date: Date | string;
    remarks: string | null;
    customer_id: string | null;
    store_id: string;
    user_id: string | null;
    payment_method: PaymentMethod | null;
    supplier_id: string | null;
    supplier_order_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface TransactionWithDetails extends Transaction {
    variation_name: string;
    barcode: string;
    sku: string | null;
    color: string | null;
    unit_name: string;
    unit_id: string;
    product_name: string;
    variation_image_url: string | null;
    product_image_url: string | null;
    category_name: string;
    customer_name?: string;
}

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
    transaction_view_limit_days: number | null;
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
