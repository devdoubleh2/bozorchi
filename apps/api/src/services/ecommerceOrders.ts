import crypto from "crypto";

export type EcommerceOrderItem = {
  product_variation_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  remarks?: string;
};

export type EcommerceOrder = {
  id: string;
  organizationId: string;
  storeId: string;
  phoneNumber: string;
  items: EcommerceOrderItem[];
  totalAmount: number;
  currency: string;
  status: "pending" | "approved" | "declined";
  groupId: string;
  createdAt: string;
  expiresAt: number;
};

const ORDER_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60; // 1 hour cleanup interval
const orders = new Map<string, EcommerceOrder>();

const isExpired = (order: EcommerceOrder) => Date.now() > order.expiresAt;

/**
 * Periodic cleanup of expired orders from in-memory store
 * Runs on module initialization
 */
const initializeCleanupInterval = () => {
  const cleanupInterval = setInterval(() => {
    let expiredCount = 0;
    for (const [id, order] of orders.entries()) {
      if (isExpired(order)) {
        orders.delete(id);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      console.log(
        `[EcommerceOrders] Cleaned up ${expiredCount} expired orders at ${new Date().toISOString()}`
      );
    }
  }, CLEANUP_INTERVAL_MS);

  // Prevent process from hanging due to interval
  cleanupInterval.unref();
};

// Initialize cleanup on module load
initializeCleanupInterval();

const purgeIfExpired = (orderId: string) => {
  const order = orders.get(orderId);
  if (order && isExpired(order)) {
    orders.delete(orderId);
    return true;
  }
  return false;
};

export const createPendingOrder = (input: {
  organizationId: string;
  storeId: string;
  phoneNumber: string;
  items: EcommerceOrderItem[];
  totalAmount: number;
  currency?: string;
  groupId?: string;
}): EcommerceOrder => {
  const id = crypto.randomUUID();
  const groupId = input.groupId || `ecommerce-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const order: EcommerceOrder = {
    id,
    organizationId: input.organizationId,
    storeId: input.storeId,
    phoneNumber: input.phoneNumber,
    items: input.items,
    totalAmount: input.totalAmount,
    currency: input.currency || "UZS",
    status: "pending",
    groupId,
    createdAt,
    expiresAt: Date.now() + ORDER_TTL_MS,
  };

  orders.set(id, order);
  return order;
};

export const getOrder = (orderId: string): EcommerceOrder | null => {
  if (purgeIfExpired(orderId)) return null;
  return orders.get(orderId) ?? null;
};

export const approveOrder = (orderId: string): EcommerceOrder | null => {
  const order = getOrder(orderId);
  if (!order) return null;
  if (order.status !== "pending") return order;

  const updated: EcommerceOrder = { ...order, status: "approved" };
  orders.set(orderId, updated);
  return updated;
};

export const declineOrder = (orderId: string): EcommerceOrder | null => {
  const order = getOrder(orderId);
  if (!order) return null;
  if (order.status !== "pending") return order;

  const updated: EcommerceOrder = { ...order, status: "declined" };
  orders.set(orderId, updated);
  return updated;
};

export const deleteOrder = (orderId: string): void => {
  orders.delete(orderId);
};

/**
 * TODO: Replace in-memory orders Map with persistent database storage
 *
 * Current approach:
 * - Uses Map<string, EcommerceOrder> for fast lookup
 * - Loses all pending orders on process restart
 * - Memory grows until cleanup interval (1 hour)
 *
 * Required changes:
 * 1. Create "pending_orders" DB table with fields:
 *    - id (primary key, UUID)
 *    - organization_id
 *    - store_id
 *    - phone_number
 *    - items (JSON)
 *    - total_amount
 *    - currency
 *    - status ('pending' | 'approved' | 'declined')
 *    - group_id
 *    - created_at
 *    - expires_at (timestamp for TTL)
 *
 * 2. Update all functions to use DB:
 *    - createPendingOrder: INSERT INTO pending_orders
 *    - getOrder: SELECT * FROM pending_orders WHERE id AND expires_at > NOW()
 *    - approveOrder: UPDATE pending_orders SET status='approved' WHERE id
 *    - declineOrder: UPDATE pending_orders SET status='declined' WHERE id
 *    - deleteOrder: DELETE FROM pending_orders WHERE id
 *
 * 3. Implement persistent TTL via:
 *    - Scheduled job (every 1 hour): DELETE FROM pending_orders WHERE expires_at < NOW()
 *    - Or: Use database native TTL if available
 *
 * 4. Ensure atomicity:
 *    - Approve/decline operations must be transactions
 *    - Double-check status before modifying to prevent race conditions
 *
 * 5. Load existing pending orders on startup to handle process restarts
 */
