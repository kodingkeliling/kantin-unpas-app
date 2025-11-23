'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { auth } from '@/lib/auth';
import { getKantinById } from '@/lib/data';
import { Kantin, Menu } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { showAlert } from '@/lib/swal';

export default function KantinDashboardPage() {
  const router = useRouter();
  const [authData] = useState(auth.getAuth());
  const [kantin, setKantin] = useState<Kantin | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
  });

  useEffect(() => {
    if (!authData || !auth.isKantin()) {
      router.push('/login');
      return;
    }

    if (authData.role === 'kantin') {
      const kantinData = getKantinById(authData.kantinId);
      if (kantinData) {
        setKantin(kantinData);
      }
    }
  }, [authData, router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const handleAddMenu = () => {
    if (!kantin) return;

    if (!formData.name || !formData.price) {
      showAlert.warning('Harap isi nama dan harga menu');
      return;
    }

    const newMenu: Menu = {
      id: `menu-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      available: formData.available,
    };

    const updatedKantin = {
      ...kantin,
      menus: [...kantin.menus, newMenu],
    };

    setKantin(updatedKantin);
    setFormData({ name: '', description: '', price: '', available: true });
    setShowAddMenu(false);
    showAlert.success('Menu berhasil ditambahkan!');
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || '',
      price: menu.price.toString(),
      available: menu.available,
    });
    setShowAddMenu(true);
  };

  const handleUpdateMenu = () => {
    if (!kantin || !editingMenu) return;

    const updatedMenus = kantin.menus.map((menu) =>
      menu.id === editingMenu.id
        ? {
            ...menu,
            name: formData.name,
            description: formData.description,
            price: parseInt(formData.price),
            available: formData.available,
          }
        : menu
    );

    setKantin({ ...kantin, menus: updatedMenus });
    setFormData({ name: '', description: '', price: '', available: true });
    setEditingMenu(null);
    setShowAddMenu(false);
    alert('Menu berhasil diupdate!');
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!kantin) return;
    const result = await showAlert.confirm('Yakin ingin menghapus menu ini?', 'Konfirmasi Hapus', 'Ya, Hapus', 'Batal');
    if (!result.isConfirmed) return;

    const updatedMenus = kantin.menus.filter((menu) => menu.id !== menuId);
    setKantin({ ...kantin, menus: updatedMenus });
    showAlert.success('Menu berhasil dihapus!');
  };

  const handleToggleAvailability = (menuId: string) => {
    if (!kantin) return;

    const updatedMenus = kantin.menus.map((menu) =>
      menu.id === menuId ? { ...menu, available: !menu.available } : menu
    );

    setKantin({ ...kantin, menus: updatedMenus });
  };

  if (!authData || !kantin || !auth.isKantin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Memuat...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Kantin</h1>
            <p className="text-gray-600">{authData.role === 'kantin' ? authData.kantinName : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Menu Kantin</h2>
            <button
              onClick={() => {
                setShowAddMenu(!showAddMenu);
                setEditingMenu(null);
                setFormData({ name: '', description: '', price: '', available: true });
              }}
              className="bg-unpas-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors"
            >
              {showAddMenu ? 'Batal' : '+ Tambah Menu'}
            </button>
          </div>

          {showAddMenu && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-blue"
                    placeholder="Contoh: Nasi Goreng Spesial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-blue"
                    rows={2}
                    placeholder="Deskripsi menu..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-blue"
                    placeholder="15000"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4 text-unpas-blue border-gray-300 rounded focus:ring-unpas-blue"
                  />
                  <label htmlFor="available" className="text-sm text-gray-700">
                    Tersedia
                  </label>
                </div>
                <button
                  onClick={editingMenu ? handleUpdateMenu : handleAddMenu}
                  className="w-full bg-unpas-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors"
                >
                  {editingMenu ? 'Update Menu' : 'Tambah Menu'}
                </button>
              </div>
            </div>
          )}

          {kantin.menus.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada menu</p>
          ) : (
            <div className="space-y-3">
              {kantin.menus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">{menu.name}</h3>
                      {!menu.available && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                          Tidak Tersedia
                        </span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                    )}
                    <p className="text-lg font-bold text-unpas-blue mt-2">
                      {formatCurrency(menu.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvailability(menu.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        menu.available
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {menu.available ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleEditMenu(menu)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

