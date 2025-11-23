import { Kantin } from '@/types';

const KANTIN_STORAGE_KEY = 'ekantin_kantin_list';

export interface KantinAccount {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  password: string;
  spreadsheetApiUrl?: string;
  spreadsheetUrl?: string;
  email?: string;
  whatsapp?: string;
  coverImage?: string;
  qrisImage?: string;
  createdAt: string;
}

export const kantinStorage = {
  getAll: (): KantinAccount[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KANTIN_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  save: (kantin: KantinAccount): void => {
    if (typeof window === 'undefined') return;
    const kantins = kantinStorage.getAll();
    const existingIndex = kantins.findIndex((k) => k.id === kantin.id);
    if (existingIndex >= 0) {
      kantins[existingIndex] = kantin;
    } else {
      kantins.push(kantin);
    }
    localStorage.setItem(KANTIN_STORAGE_KEY, JSON.stringify(kantins));
  },
  findById: (id: string): KantinAccount | undefined => {
    const kantins = kantinStorage.getAll();
    return kantins.find((k) => k.id === id);
  },
  delete: (id: string): void => {
    if (typeof window === 'undefined') return;
    const kantins = kantinStorage.getAll();
    const filtered = kantins.filter((k) => k.id !== id);
    localStorage.setItem(KANTIN_STORAGE_KEY, JSON.stringify(filtered));
  },
};

