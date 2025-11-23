'use client';

import { FaUtensils, FaClipboardList } from 'react-icons/fa';

interface KantinTabNavigationProps {
  activeTab: 'menu' | 'pesanan';
  onTabChange: (tab: 'menu' | 'pesanan') => void;
}

export default function KantinTabNavigation({ activeTab, onTabChange }: KantinTabNavigationProps) {
  return (
    <div className="bg-white rounded-lg">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('menu')}
          className={`flex-1 px-6 py-4 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'menu'
              ? 'text-unpas-blue border-b-2 border-unpas-blue bg-unpas-blue/5'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <FaUtensils className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <button
          onClick={() => onTabChange('pesanan')}
          className={`flex-1 px-6 py-4 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'pesanan'
              ? 'text-unpas-blue border-b-2 border-unpas-blue bg-unpas-blue/5'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <FaClipboardList className="w-4 h-4" />
          <span>Pesanan</span>
        </button>
      </div>
    </div>
  );
}

