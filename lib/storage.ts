import { Transaction, CartItem, DeliveryLocation } from '@/types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'ekantin_transactions',
  DELIVERY_LOCATION: 'ekantin_delivery_location',
  CART: 'ekantin_cart',
} as const;

export const storage = {
  transactions: {
    getAll: (): Transaction[] => {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    },
    save: (transaction: Transaction): void => {
      if (typeof window === 'undefined') return;
      const transactions = storage.transactions.getAll();
      transactions.unshift(transaction);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },
    findById: (id: string): Transaction | undefined => {
      const transactions = storage.transactions.getAll();
      return transactions.find((t) => t.id === id || t.code === id);
    },
    findByCode: (code: string): Transaction | undefined => {
      const transactions = storage.transactions.getAll();
      return transactions.find((t) => t.code.toLowerCase() === code.toLowerCase());
    },
  },
  deliveryLocation: {
    get: (): DeliveryLocation | null => {
      if (typeof window === 'undefined') return null;
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERY_LOCATION);
      return data ? JSON.parse(data) : null;
    },
    save: (location: DeliveryLocation): void => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEYS.DELIVERY_LOCATION, JSON.stringify(location));
    },
    clear: (): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(STORAGE_KEYS.DELIVERY_LOCATION);
    },
  },
  cart: {
    get: (): Record<string, CartItem> => {
      if (typeof window === 'undefined') return {};
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : {};
    },
    save: (cart: Record<string, CartItem>): void => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    },
    clear: (): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(STORAGE_KEYS.CART);
    },
  },
};

