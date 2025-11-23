export interface Menu {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  available: boolean;
  quantity?: number; // Stock/jumlah tersedia
}

export interface Kantin {
  id: string;
  name: string;
  description?: string;
  image?: string;
  menus: Menu[];
  ownerId: string;
}

export interface CartItem {
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
}

export interface DeliveryLocation {
  name: string;
  tableNumber: string;
  scannedAt: string;
}

export interface Transaction {
  id: string;
  code: string;
  kantinId: string;
  kantinName: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  paymentProof?: string;
  deliveryLocation?: DeliveryLocation;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
}

