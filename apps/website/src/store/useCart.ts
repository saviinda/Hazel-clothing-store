import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderItem } from '@hazel/shared';

interface CartState {
  items: OrderItem[];
  addItem: (item: Omit<OrderItem, 'qty'> & { qty?: number }) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (item) =>
            item.product_id === newItem.product_id &&
            item.size === newItem.size &&
            item.color === newItem.color
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].qty += newItem.qty || 1;
          set({ items: updatedItems });
        } else {
          set({
            items: [...currentItems, { ...newItem, qty: newItem.qty || 1 } as OrderItem],
          });
        }
      },

      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.product_id === productId &&
                item.size === size &&
                item.color === color
              )
          ),
        });
      },

      updateQty: (productId, size, color, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, size, color);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.product_id === productId && item.size === size && item.color === color
              ? { ...item, qty }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.qty, 0);
      },
    }),
    {
      name: 'hazel-cart-storage',
    }
  )
);
