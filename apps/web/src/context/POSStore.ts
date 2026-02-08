import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProductVariation {
  id: string;
  name: string;
  barcode: string;
  sku: string | null;
  price: number;
  selling_price: number;
  description: string;
  color: string | null;
  image_url: string | null;
  unit: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    image_url: string | null;
    type?: "simple" | "variable" | "service";
    category: {
      id: string;
      name: string;
    };
    product_category: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

export interface InventoryItem {
  id: string;
  product_variation: ProductVariation;
  quantity_in_stock: number;
  created_at: string;
  updated_at: string | null;
  is_service?: boolean;
}

interface CartItem extends InventoryItem {
  cart_quantity: number;
}

interface Discount {
  type: "percentage" | "amount";
  value: number;
}

interface LoyaltyRedemption {
  customerId: string;
  points: number;
  amount: number;
}

export interface ReceiptLine {
  id: string;
  productName: string;
  variationName: string;
  quantity: number;
  unitName: string | null;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptData {
  id: string; // Added transaction ID
  cashierName?: string; // Added cashier name
  createdAt: string;
  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  customerName?: string | null;
  isDebtSale: boolean;
  subtotal: number;
  discountAmount: number;
  loyaltyDiscountAmount: number;
  total: number;
  lines: ReceiptLine[];
}

export type PaymentMethod = "cash" | "card" | "transfer" | "dynamic_qr" | "other";

export interface PaymentMethodConfig {
  cash: boolean;
  card: boolean;
  transfer: boolean;
  dynamic_qr: boolean;
  other: boolean;
}

export interface CustomerSession {
  customerId: string;
  customerName: string;
  cart: CartItem[];
  discount: Discount | null;
  loyaltyRedemption: LoyaltyRedemption | null;
  isDebtSale: boolean;
  pausedAt: number; // Timestamp when session was paused
}

interface POSState {
  // Active cart (current customer being served)
  cart: CartItem[];
  currency: string;
  discount: Discount | null;
  loyaltyRedemption: LoyaltyRedemption | null;
  is_processing_transaction: boolean;
  isDebtSale: boolean;
  lastReceipts: ReceiptData[];
  paymentMethods: PaymentMethodConfig;

  // Customer sessions (paused/queued customers)
  activeCustomerId: string | null; // Current customer ID being served
  pausedSessions: Record<string, CustomerSession>; // Map of customerId -> session

  // Cart methods
  addToCart: (item: InventoryItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  incrementQuantity: (itemId: string) => void;
  decrementQuantity: (itemId: string) => void;
  clearCart: () => void;

  // Discount & Loyalty methods
  setDiscount: (discount: Discount | null) => void;
  clearDiscount: () => void;

  setLoyaltyRedemption: (redemption: LoyaltyRedemption | null) => void;
  clearLoyaltyRedemption: () => void;

  // Settings methods
  setCurrency: (currency: string) => void;
  setIsProcessingTransaction: (value: boolean) => void;
  setIsDebtSale: (value: boolean) => void;
  addReceipt: (receipt: ReceiptData) => void;
  updatePaymentMethods: (methods: Partial<PaymentMethodConfig>) => void;

  // Session lock methods (for multi-customer POS queue)
  pauseSession: (customerId: string, customerName: string) => void;
  resumeSession: (customerId: string) => boolean;
  switchSession: (customerId: string) => boolean;
  removeSession: (customerId: string) => void;
  getPausedSessionIds: () => string[];

  // Getter methods
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isItemInCart: (itemId: string) => boolean;
  getCartItem: (itemId: string) => CartItem | undefined;
  getDiscountAmount: () => number;
  getLoyaltyRedemptionAmount: () => number;
  getFinalTotal: () => number;
  getSessionCount: () => number;
  reset: () => void;
}

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => window.localStorage)
    : undefined;

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: [],
      currency: "UZS",
      discount: null,
      loyaltyRedemption: null,
      is_processing_transaction: false,
      isDebtSale: false,
      lastReceipts: [],
      paymentMethods: {
        cash: true,
        card: true,
        transfer: true,
        dynamic_qr: true,
        other: true,
      },
      activeCustomerId: null,
      pausedSessions: {},

      // Cart operations
      addToCart: (item) => {
        const existing = get().cart.find((cartItem) => cartItem.id === item.id);
        const isService = item.is_service || item.product_variation?.product?.type === "service";

        if (existing) {
          // Services have unlimited stock, no limit check
          if (isService || existing.cart_quantity < item.quantity_in_stock) {
            set({
              cart: get().cart.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                    ...cartItem,
                    cart_quantity: cartItem.cart_quantity + 1,
                  }
                  : cartItem
              ),
            });
          }
        } else {
          set({ cart: [...get().cart, { ...item, cart_quantity: 1 }] });
        }
      },

      removeFromCart: (itemId) => {
        set({ cart: get().cart.filter((item) => item.id !== itemId) });
      },

      updateCartQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set({
          cart: get().cart.map((item) => {
            if (item.id !== itemId) return item;
            const isService = item.is_service || item.product_variation?.product?.type === "service";
            // Services have no stock limit
            const maxQuantity = isService ? quantity : Math.min(quantity, item.quantity_in_stock);
            return {
              ...item,
              cart_quantity: maxQuantity,
            };
          }),
        });
      },

      incrementQuantity: (itemId) => {
        const item = get().cart.find((cartItem) => cartItem.id === itemId);
        if (item) {
          const isService = item.is_service || item.product_variation?.product?.type === "service";
          // Services have unlimited stock
          if (isService || item.cart_quantity < item.quantity_in_stock) {
            get().updateCartQuantity(itemId, item.cart_quantity + 1);
          }
        }
      },

      decrementQuantity: (itemId) => {
        const item = get().cart.find((cartItem) => cartItem.id === itemId);
        if (!item) return;
        if (item.cart_quantity <= 1) {
          get().removeFromCart(itemId);
        } else {
          get().updateCartQuantity(itemId, item.cart_quantity - 1);
        }
      },

      clearCart: () => {
        set({
          cart: [],
          discount: null,
          loyaltyRedemption: null,
          isDebtSale: false,
        });
      },

      // Discount & Loyalty
      setDiscount: (discount) => {
        set({ discount });
      },

      clearDiscount: () => {
        set({ discount: null });
      },

      setLoyaltyRedemption: (redemption) => {
        set({ loyaltyRedemption: redemption });
      },

      clearLoyaltyRedemption: () => {
        set({ loyaltyRedemption: null });
      },

      // Settings
      setCurrency: (currency) => {
        set({ currency });
      },

      setIsProcessingTransaction: (value) => {
        set({ is_processing_transaction: value });
      },

      setIsDebtSale: (value) => {
        set({ isDebtSale: value });
      },

      addReceipt: (receipt) => {
        set((state) => ({
          lastReceipts: [receipt, ...state.lastReceipts].slice(0, 50),
        }));
      },

      updatePaymentMethods: (methods) => {
        set((state) => ({
          paymentMethods: { ...state.paymentMethods, ...methods },
        }));
      },

      // Session locking methods
      pauseSession: (customerId, customerName) => {
        // Save current cart state as a paused session
        set((prevState) => ({
          pausedSessions: {
            ...prevState.pausedSessions,
            [customerId]: {
              customerId,
              customerName,
              cart: prevState.cart,
              discount: prevState.discount,
              loyaltyRedemption: prevState.loyaltyRedemption,
              isDebtSale: prevState.isDebtSale,
              pausedAt: Date.now(),
            },
          },
          // Clear active cart
          cart: [],
          discount: null,
          loyaltyRedemption: null,
          isDebtSale: false,
          activeCustomerId: null,
        }));
      },

      resumeSession: (customerId) => {
        const state = get();
        const session = state.pausedSessions[customerId];

        if (!session) {
          console.warn(`[POS] Session not found for customer: ${customerId}`);
          return false;
        }

        // If there's a current active session, pause it first
        if (state.activeCustomerId && state.cart.length > 0) {
          get().pauseSession(state.activeCustomerId, "Current Customer");
        }

        // Restore the paused session
        set((prevState) => {
          const updatedSessions = { ...prevState.pausedSessions };
          delete updatedSessions[customerId];

          return {
            cart: session.cart,
            discount: session.discount,
            loyaltyRedemption: session.loyaltyRedemption,
            isDebtSale: session.isDebtSale,
            activeCustomerId: customerId,
            pausedSessions: updatedSessions,
          };
        });

        return true;
      },

      switchSession: (customerId) => {
        const state = get();

        // If trying to switch to a session that doesn't exist
        if (!state.pausedSessions[customerId]) {
          console.warn(`[POS] Session not found for customer: ${customerId}`);
          return false;
        }

        // Pause current session if there's an active one with items
        if (state.activeCustomerId && state.cart.length > 0) {
          get().pauseSession(state.activeCustomerId, "Current Customer");
        }

        // Resume the target session
        return get().resumeSession(customerId);
      },

      removeSession: (customerId) => {
        set((prevState) => {
          const updatedSessions = { ...prevState.pausedSessions };
          delete updatedSessions[customerId];
          return { pausedSessions: updatedSessions };
        });
      },

      getPausedSessionIds: () => {
        return Object.keys(get().pausedSessions);
      },

      // Getter methods
      getCartTotal: () =>
        get().cart.reduce(
          (total, item) =>
            total + item.product_variation.selling_price * item.cart_quantity,
          0
        ),

      getCartItemCount: () =>
        get().cart.reduce((count, item) => count + item.cart_quantity, 0),

      isItemInCart: (itemId) => get().cart.some((item) => item.id === itemId),

      getCartItem: (itemId) =>
        get().cart.find((item) => item.id === itemId),

      getDiscountAmount: () => {
        const discount = get().discount;
        if (!discount) return 0;
        const cartTotal = get().getCartTotal();
        if (discount.type === "percentage") {
          return (cartTotal * discount.value) / 100;
        }
        return Math.min(discount.value, cartTotal);
      },

      getLoyaltyRedemptionAmount: () => {
        const redemption = get().loyaltyRedemption;
        return redemption ? redemption.amount : 0;
      },

      getFinalTotal: () =>
        Math.max(
          0,
          get().getCartTotal() -
          get().getDiscountAmount() -
          get().getLoyaltyRedemptionAmount()
        ),

      getSessionCount: () => Object.keys(get().pausedSessions).length,

      reset: () => {
        set({
          cart: [],
          currency: "UZS",
          discount: null,
          loyaltyRedemption: null,
          is_processing_transaction: false,
          isDebtSale: false,
          lastReceipts: [],
          paymentMethods: {
            cash: true,
            card: true,
            transfer: true,
            dynamic_qr: true,
            other: true,
          },
          activeCustomerId: null,
          pausedSessions: {},
        });
      },
    }),
    {
      name: "pos-storage",
      storage,
      partialize: (state) => ({
        cart: state.cart,
        currency: state.currency,
        discount: state.discount,
        loyaltyRedemption: state.loyaltyRedemption,
        lastReceipts: state.lastReceipts,
        paymentMethods: state.paymentMethods,
        activeCustomerId: state.activeCustomerId,
        pausedSessions: state.pausedSessions, // Persist sessions
      }),
    }
  )
);
