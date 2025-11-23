import { Kantin } from '@/types';

const KANTIN_STORAGE_KEY = 'ekantin_kantin_list';

export interface OperatingHours {
  day: number; // 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu, 7 = Minggu
  open: string; // '08:00'
  close: string; // '17:00'
  isOpen: boolean; // true if open on this day
}

// Utility functions for day conversion
export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function getDayName(dayNumber: number): string {
  if (dayNumber >= 1 && dayNumber <= 7) {
    return DAY_NAMES[dayNumber - 1];
  }
  return '';
}

export function getDayNumber(dayName: string): number {
  const index = DAY_NAMES.findIndex(name => name.toLowerCase() === dayName.toLowerCase());
  return index >= 0 ? index + 1 : 1;
}

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
  isOpen?: boolean;
  operatingHours?: OperatingHours[];
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
  replaceAll: (kantins: KantinAccount[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KANTIN_STORAGE_KEY, JSON.stringify(kantins));
  },
};

