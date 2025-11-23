'use client';

import { Menu } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { storage } from '@/lib/storage';

interface MenuCardProps {
  menu: Menu;
  kantinId?: string;
  onAddToCart?: () => void;
}

export default function MenuCard({ menu, kantinId, onAddToCart }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const cart = storage.cart.get();
    const existingItem = cart[menu.id];

    if (existingItem) {
      cart[menu.id] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
      };
    } else {
      cart[menu.id] = {
        menuId: menu.id,
        menuName: menu.name,
        quantity,
        price: menu.price,
      };
    }

    storage.cart.save(cart);
    if (onAddToCart) onAddToCart();
    
    setQuantity(1);
  };

  if (!menu.available) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 opacity-60">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-700 line-through">{menu.name}</h3>
            {menu.description && (
              <p className="text-sm text-gray-500 mt-1">{menu.description}</p>
            )}
            <p className="text-lg font-bold text-gray-500 mt-2">{formatCurrency(menu.price)}</p>
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
            Tidak Tersedia
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {menu.image && (
        <div className="w-full h-40 sm:h-48 bg-gray-200 overflow-hidden">
          <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-800 text-base sm:text-lg">{menu.name}</h3>
          {menu.description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{menu.description}</p>
          )}
          <p className="text-lg sm:text-xl font-bold text-unpas-blue mt-2">{formatCurrency(menu.price)}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg justify-center">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              aria-label="Kurangi jumlah"
            >
              -
            </button>
            <span className="px-4 py-2 text-gray-800 font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-unpas-blue text-white px-4 py-3 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors min-h-[44px] text-sm sm:text-base"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}

