export declare enum ProductType {
    simple = "simple",
    variable = "variable",
    service = "service"
}
export declare enum TransactionType {
    import = "import",
    export = "export",
    return = "return",
    adjustment = "adjustment",
    debt = "debt",
    repayment = "repayment",
    exchange = "exchange",
    internal_use = "internal_use",
    transfer_in = "transfer_in",
    transfer_out = "transfer_out",
    supplier_return = "supplier_return"
}
export declare enum PaymentMethod {
    cash = "cash",
    card = "card",
    transfer = "transfer",
    other = "other"
}
export declare enum WriteOffReason {
    expired = "expired",
    damaged = "damaged",
    lost = "lost",
    other = "other"
}
export declare enum InventoryAllocationReference {
    transaction = "transaction",
    order = "order",
    reservation = "reservation",
    adjustment = "adjustment",
    manual = "manual"
}
export interface Unit {
    id: string;
    name: string;
    organization_id: string;
    store_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Store {
    id: string;
    name: string;
    organization_id: string;
    currency: string | null;
    loyalty_cashback_percentage: number;
    address: string | null;
    phone: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface ProductCategory {
    id: string;
    name: string;
    color: string | null;
    store_id: string;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Product {
    id: string;
    name: string;
    image_url: string | null;
    product_category_id: string | null;
    organization_id: string;
    store_id: string | null;
    user_id: string | null;
    type: ProductType;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface ProductVariation {
    id: string;
    name: string;
    barcode: string;
    sku: string | null;
    price: number;
    selling_price: number;
    description: string;
    color: string | null;
    image_url: string | null;
    unit_id: string | null;
    product_id: string;
    store_id: string | null;
    supplier_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Inventory {
    id: string;
    product_variation_id: string;
    quantity_in_stock: number;
    store_id: string;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    language: string | null;
    gender: string | null;
    date_of_birth: Date | string | null;
    social_links: any;
    organization_id: string;
    store_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Transaction {
    id: string;
    product_variation_id: string | null;
    quantity: number;
    unit_price: number;
    selling_price: number;
    total_amount: number;
    transaction_type: TransactionType;
    transaction_date: Date | string;
    customer_id: string | null;
    store_id: string;
    user_id: string | null;
    remarks: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Payment {
    id: string;
    amount: number;
    payment_method: PaymentMethod;
    received_at: Date | string;
    transaction_id: string | null;
    customer_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface Supplier {
    id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    store_id: string;
    created_at: Date | string;
    updated_at: Date | string;
}
export interface ProductVariationWithRelations extends ProductVariation {
    product?: Product;
    unit?: Unit;
    supplier?: Supplier;
    inventory?: Inventory;
}
export interface TransactionWithDetails extends Transaction {
    variation_name?: string;
    barcode?: string;
    sku?: string | null;
    color?: string | null;
    unit_name?: string;
    unit_id?: string;
    product_name?: string;
    variation_image_url?: string | null;
    product_image_url?: string | null;
    category_name?: string;
    customer_name?: string;
    payments?: Payment[];
}
export interface InventoryItem {
    id: string;
    product_variation: ProductVariationWithRelations;
    quantity_in_stock: number;
    created_at: string;
    updated_at: string | null;
    is_service?: boolean;
}
//# sourceMappingURL=types.d.ts.map