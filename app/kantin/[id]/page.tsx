'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import { kantinStorage, KantinAccount } from '@/lib/kantin';
import { Menu, CartItem } from '@/types';
import { storage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

export default function KantinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [kantin, setKantin] = useState<KantinAccount | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoadingKantin, setIsLoadingKantin] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const loadKantin = () => {
      const kantinId = params.id as string;
      const kantinData = kantinStorage.findById(kantinId);
      
      if (!kantinData) {
        router.push('/kantin');
        return;
      }
      
      setKantin(kantinData);
      localStorage.setItem('current_kantin_id', kantinData.id);
      setIsLoadingKantin(false);
      
      // Load menus from kantin's spreadsheet
      if (kantinData.spreadsheetApiUrl) {
        loadMenus(kantinData.spreadsheetApiUrl);
      } else {
        setIsLoadingMenus(false);
      }
    };

    loadKantin();
  }, [params.id, router]);

  const loadMenus = async (spreadsheetApiUrl: string) => {
    setIsLoadingMenus(true);
    try {
      const response = await fetch(`/api/google-script?sheet=Menus&scriptUrl=${encodeURIComponent(spreadsheetApiUrl)}`);
      const result = await response.json();
      
      // Handle both response formats: {success: true, data: [...]} or {data: [...]}
      let menuData: any[] = [];
      
      if (result.data && Array.isArray(result.data)) {
        menuData = result.data;
      } else if (Array.isArray(result)) {
        menuData = result;
      } else if (result.success !== false && result.data) {
        menuData = Array.isArray(result.data) ? result.data : [];
      }
      
      if (menuData.length > 0) {
        // Parse data from spreadsheet
        const parsedMenus = menuData.map((menu: any) => ({
          id: menu.id || `menu-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: menu.name || '',
          description: menu.description || '',
          price: typeof menu.price === 'string' ? parseInt(menu.price) : (menu.price || 0),
          available: menu.available === true || menu.available === 'true' || menu.available === 'TRUE',
          image: menu.image || '',
          quantity: menu.quantity ? (typeof menu.quantity === 'string' ? parseInt(menu.quantity) : menu.quantity) : undefined,
        }));
        setMenus(parsedMenus);
      } else {
        setMenus([]);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      setMenus([]);
    } finally {
      setIsLoadingMenus(false);
    }
  };

  useEffect(() => {
    const savedCart = storage.cart.get();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(savedCart);
    const count = Object.values(savedCart).reduce((sum, item) => sum + item.quantity, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartCount(count);
  }, []);

  const handleAddToCart = () => {
    const savedCart = storage.cart.get();
    setCart(savedCart);
    const count = Object.values(savedCart).reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoadingKantin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!kantin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          <p className="text-gray-500">Kantin tidak ditemukan</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <Link
            href="/kantin"
            className="inline-flex items-center gap-2 text-unpas-blue hover:text-unpas-blue/80 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Kantin
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{kantin.name}</h1>
            {kantin.isOpen !== false && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Buka
              </span>
            )}
            {kantin.isOpen === false && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Tutup
              </span>
            )}
          </div>
          {kantin.description && (
            <p className="text-gray-600 mb-4">{kantin.description}</p>
          )}
          {kantin.coverImage && (
            <div className="mb-4 rounded-lg overflow-hidden relative w-full h-64">
              <Image 
                src={kantin.coverImage} 
                alt={kantin.name} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                onError={(e) => {
                  console.error('Error loading cover image:', kantin.coverImage);
                }}
              />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 pb-24 lg:pb-0">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Menu</h2>
            {isLoadingMenus ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : menus.length === 0 ? (
              <p className="text-gray-500">Tidak ada menu tersedia</p>
            ) : (
              <div className="space-y-4">
                {menus.map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    kantinId={kantin.id}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop Cart */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Keranjang</h3>
              {cartCount === 0 ? (
                <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {Object.values(cart).map((item) => (
                      <div key={item.menuId} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.menuName}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold text-unpas-blue">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-unpas-blue">{formatCurrency(total)}</span>
                    </div>
                      <Link
                        href={`/kantin/${kantin.id}/checkout`}
                        className="block w-full bg-unpas-blue text-white text-center px-4 py-3 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors"
                      >
                        Checkout ({cartCount} item)
                      </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Cart - Sticky Bottom */}
        {cartCount > 0 && (
          <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="w-full px-4 py-3 flex items-center justify-between bg-unpas-blue text-white"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-unpas-gold text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Keranjang ({cartCount} item)</p>
                  <p className="text-xs opacity-90">{formatCurrency(total)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatCurrency(total)}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${isCartOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {isCartOpen && (
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="p-4 space-y-3 border-b border-gray-200">
                  {Object.values(cart).map((item) => (
                    <div key={item.menuId} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{item.menuName}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-unpas-blue text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-800">Total</span>
                    <span className="text-lg font-bold text-unpas-blue">{formatCurrency(total)}</span>
                  </div>
                  <Link
                    href={`/kantin/${kantin.id}/checkout`}
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full bg-unpas-blue text-white text-center px-4 py-3 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

