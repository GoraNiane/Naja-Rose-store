import { useState, useEffect } from 'react';
import { CartItem } from '../types';

const CART_STORAGE_KEY = 'naja_cart_items_v1';

let globalListeners: Array<() => void> = [];
let globalItems: CartItem[] = [];

try {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (saved) {
    globalItems = JSON.parse(saved);
  }
} catch {
  globalItems = [];
}

function notify() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(globalItems));
  globalListeners.forEach((listener) => listener());
}

export const cartStore = {
  getItems: () => globalItems,

  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const existingIndex = globalItems.findIndex((i) => i.variantId === item.variantId);
    const qtyToAdd = item.quantity || 1;

    if (existingIndex > -1) {
      const existing = globalItems[existingIndex];
      const newQty = Math.min(existing.quantity + qtyToAdd, item.maxStock);
      globalItems[existingIndex] = { ...existing, quantity: newQty };
    } else {
      globalItems.push({
        ...item,
        quantity: Math.min(qtyToAdd, item.maxStock),
      });
    }
    notify();
  },

  addItems: (itemsToAdd: (Omit<CartItem, 'quantity'> & { quantity?: number })[]) => {
    itemsToAdd.forEach((item) => {
      const existingIndex = globalItems.findIndex((i) => i.variantId === item.variantId);
      const qtyToAdd = item.quantity || 1;

      if (existingIndex > -1) {
        const existing = globalItems[existingIndex];
        const newQty = Math.min(existing.quantity + qtyToAdd, item.maxStock);
        globalItems[existingIndex] = { ...existing, quantity: newQty };
      } else {
        globalItems.push({
          ...item,
          quantity: Math.min(qtyToAdd, item.maxStock),
        });
      }
    });
    notify();
  },

  updateQuantity: (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(variantId);
      return;
    }
    const item = globalItems.find((i) => i.variantId === variantId);
    if (item) {
      item.quantity = Math.min(quantity, item.maxStock);
      notify();
    }
  },

  removeItem: (variantId: string) => {
    globalItems = globalItems.filter((i) => i.variantId !== variantId);
    notify();
  },

  clearCart: () => {
    globalItems = [];
    notify();
  },

  getSubtotal: () => {
    return globalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  },

  getCount: () => {
    return globalItems.reduce((acc, item) => acc + item.quantity, 0);
  },

  getItemsByProduct: (productId: string) => {
    return globalItems.filter((i) => i.productId === productId);
  },
};

export function useCartStore() {
  const [items, setItems] = useState<CartItem[]>(globalItems);

  useEffect(() => {
    const listener = () => setItems([...globalItems]);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    items,
    itemCount: cartStore.getCount(),
    subtotal: cartStore.getSubtotal(),
    addItem: cartStore.addItem,
    addItems: cartStore.addItems,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
    getItemsByProduct: cartStore.getItemsByProduct,
  };
}
