import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
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
  unit: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    image_url: string;
    type?: "simple" | "variable" | "service";
    category: {
      id: string;
      name: string;
    } | null;
  };
}

export interface InventoryItem {
  id: string;
  product_variation: ProductVariation;
  quantity_in_stock: number;
  created_at: string;
  updated_at: string | null;
  is_service?: boolean; // Services have unlimited stock
}

export interface CartItem extends InventoryItem {
  cart_quantity: number;
}

export interface Discount {
  type: "percentage" | "amount";
  value: number;
}

interface POSState {
  // Cart state
  cart: CartItem[];

  // UI state
  show_cart: boolean;
  is_processing_transaction: boolean;
  currency: string;
  is_debt_sale: boolean;
  pinned_items: string[];

  // Discount state
  discount: Discount | null;

  // Actions for cart management
  addToCart: (item: InventoryItem) => void;
  removeFromCart: (item_id: string) => void;
  updateCartQuantity: (item_id: string, quantity: number) => void;
  incrementQuantity: (item_id: string) => void;
  decrementQuantity: (item_id: string) => void;
  clearCart: () => void;

  togglePinnedItem: (item_id: string) => void;
  isItemPinned: (item_id: string) => boolean;

  // Discount actions
  setDiscount: (discount: Discount | null) => void;
  clearDiscount: () => void;

  // UI actions
  setShowCart: (show: boolean) => void;
  setIsProcessingTransaction: (processing: boolean) => void;
  setCurrency: (currency: string) => void;
  setIsDebtSale: (isDebtSale: boolean) => void;

  // Computed values
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isItemInCart: (item_id: string) => boolean;
  getCartItem: (item_id: string) => CartItem | undefined;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: [],
      show_cart: false,
      is_processing_transaction: false,
      currency: "UZS",
      discount: null,
      is_debt_sale: false,
      pinned_items: [],

      // Cart actions
      addToCart: (item: InventoryItem) => {
        const state = get();
        const existing_item = state.cart.find(
          (cart_item) => cart_item.id === item.id
        );
        const isService = item.is_service || item.product_variation.product.type === "service";

        if (existing_item) {
          // If item exists, increment quantity
          // Services have unlimited stock, so no limit check
          if (isService || existing_item.cart_quantity < item.quantity_in_stock) {
            set((state) => ({
              cart: state.cart.map((cart_item) =>
                cart_item.id === item.id
                  ? { ...cart_item, cart_quantity: cart_item.cart_quantity + 1 }
                  : cart_item
              ),
            }));
          }
        } else {
          // Add new item to cart
          set((state) => ({
            cart: [...state.cart, { ...item, cart_quantity: 1 }],
          }));
        }
      },

      removeFromCart: (item_id: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== item_id),
        }));
      },

      updateCartQuantity: (item_id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(item_id);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id !== item_id) return item;
            const isService = item.is_service || item.product_variation.product.type === "service";
            // Services have no stock limit
            const maxQuantity = isService ? quantity : Math.min(quantity, item.quantity_in_stock);
            return {
              ...item,
              cart_quantity: maxQuantity,
            };
          }),
        }));
      },

      incrementQuantity: (item_id: string) => {
        const state = get();
        const item = state.cart.find((cart_item) => cart_item.id === item_id);
        if (item) {
          const isService = item.is_service || item.product_variation.product.type === "service";
          // Services have unlimited stock
          if (isService || item.cart_quantity < item.quantity_in_stock) {
            get().updateCartQuantity(item_id, item.cart_quantity + 1);
          }
        }
      },

      decrementQuantity: (item_id: string) => {
        const state = get();
        const item = state.cart.find((cart_item) => cart_item.id === item_id);
        if (item) {
          if (item.cart_quantity > 1) {
            get().updateCartQuantity(item_id, item.cart_quantity - 1);
          } else {
            get().removeFromCart(item_id);
          }
        }
      },

      clearCart: () => {
        set({ cart: [], discount: null, is_debt_sale: false });
      },

      togglePinnedItem: (item_id: string) => {
        set((state) => {
          const isPinned = state.pinned_items.includes(item_id);
          const pinned_items = isPinned
            ? state.pinned_items.filter((id) => id !== item_id)
            : [...state.pinned_items, item_id];
          return { pinned_items };
        });
      },

      isItemPinned: (item_id: string) => {
        const state = get();
        return state.pinned_items.includes(item_id);
      },

      // Discount actions
      setDiscount: (discount: Discount | null) => {
        set({ discount });
      },

      clearDiscount: () => {
        set({ discount: null });
      },

      // UI actions
      setShowCart: (show: boolean) => {
        set({ show_cart: show });
      },

      setIsProcessingTransaction: (processing: boolean) => {
        set({ is_processing_transaction: processing });
      },

      setCurrency: (currency: string) => {
        set({ currency });
      },

      setIsDebtSale: (isDebtSale: boolean) => {
        set({ is_debt_sale: isDebtSale });
      },

      // Computed values
      getCartTotal: () => {
        const state = get();
        return state.cart.reduce(
          (total, item) =>
            total + item.product_variation.selling_price * item.cart_quantity,
          0
        );
      },

      getCartItemCount: () => {
        const state = get();
        return state.cart.reduce(
          (count, item) => count + item.cart_quantity,
          0
        );
      },

      isItemInCart: (item_id: string) => {
        const state = get();
        return state.cart.some((item) => item.id === item_id);
      },

      getCartItem: (item_id: string) => {
        const state = get();
        return state.cart.find((item) => item.id === item_id);
      },

      getDiscountAmount: () => {
        const state = get();
        if (!state.discount) return 0;

        const cartTotal = state.cart.reduce(
          (total, item) =>
            total + item.product_variation.selling_price * item.cart_quantity,
          0
        );

        if (state.discount.type === "percentage") {
          return (cartTotal * state.discount.value) / 100;
        } else {
          return Math.min(state.discount.value, cartTotal);
        }
      },

      getFinalTotal: () => {
        const state = get();
        const cartTotal = state.cart.reduce(
          (total, item) =>
            total + item.product_variation.selling_price * item.cart_quantity,
          0
        );
        return cartTotal - get().getDiscountAmount();
      },
    }),
    {
      name: "pos-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist cart data, currency, and discount, not UI state
      partialize: (state) => ({
        cart: state.cart,
        currency: state.currency,
        discount: state.discount,
        pinned_items: state.pinned_items,
      }),
    }
  )
);
