'use client';

import { useState } from 'react';
import { Menu } from '@/types';
import { KantinAccount } from '@/lib/kantin';
import MenuFormModal from '@/components/MenuFormModal';
import MenuTable from '@/components/MenuTable';
import { showAlert } from '@/lib/swal';

interface KantinMenuTabProps {
  menus: Menu[];
  isLoading: boolean;
  kantinData: KantinAccount;
  onMenusChange: (menus: Menu[]) => void;
}

export default function KantinMenuTab({
  menus,
  isLoading,
  kantinData,
  onMenusChange,
}: KantinMenuTabProps) {
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  const handleSubmitMenu = async (formData: {
    name: string;
    description: string;
    price: number;
    available: boolean;
    quantity?: number;
    image: string;
  }) => {
    if (!kantinData?.spreadsheetApiUrl) {
      showAlert.error('Spreadsheet API URL tidak ditemukan');
      return;
    }

    setIsSavingMenu(true);
    try {
      if (editingMenu) {
        // Update existing menu
        const updatedMenu: Menu = {
          ...editingMenu,
          ...formData,
        };

        const response = await fetch('/api/google-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptUrl: kantinData.spreadsheetApiUrl,
            sheet: 'Menu',
            action: 'update',
            id: editingMenu.id,
            data: updatedMenu,
          }),
        });

        const result = await response.json();

        if (result.success) {
          onMenusChange(menus.map((menu) =>
            menu.id === editingMenu.id ? updatedMenu : menu
          ));
          setEditingMenu(null);
          setShowMenuModal(false);
          showAlert.success('Menu berhasil diupdate!');
        } else {
          showAlert.error(result.error || 'Gagal mengupdate menu di spreadsheet');
        }
      } else {
        // Create new menu
        const newMenu: Menu = {
          id: `menu-${Date.now()}`,
          ...formData,
        };

        const response = await fetch('/api/google-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptUrl: kantinData.spreadsheetApiUrl,
            sheet: 'Menu',
            action: 'create',
            data: newMenu,
          }),
        });

        const result = await response.json();

        if (result.success) {
          onMenusChange([...menus, newMenu]);
          setShowMenuModal(false);
          showAlert.success('Menu berhasil ditambahkan!');
        } else {
          showAlert.error(result.error || 'Gagal menyimpan menu ke spreadsheet');
        }
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      showAlert.error('Terjadi kesalahan saat menyimpan menu');
    } finally {
      setIsSavingMenu(false);
    }
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setShowMenuModal(true);
  };

  const handleAddMenu = () => {
    setEditingMenu(null);
    setShowMenuModal(true);
  };

  const handleCloseModal = () => {
    setEditingMenu(null);
    setShowMenuModal(false);
  };

  const handleDeleteMenu = async (id: string) => {
    const result = await showAlert.confirm('Yakin ingin menghapus menu ini?', 'Konfirmasi Hapus', 'Ya, Hapus', 'Batal');
    if (!result.isConfirmed) return;

    if (!kantinData?.spreadsheetApiUrl) {
      showAlert.error('Spreadsheet API URL tidak ditemukan');
      return;
    }

    try {
      const response = await fetch('/api/google-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptUrl: kantinData.spreadsheetApiUrl,
          sheet: 'Menu',
          action: 'delete',
          id: id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onMenusChange(menus.filter((menu) => menu.id !== id));
        showAlert.success('Menu berhasil dihapus!');
      } else {
        showAlert.error(result.error || 'Gagal menghapus menu dari spreadsheet');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      showAlert.error('Terjadi kesalahan saat menghapus menu');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex sm:items-center justify-between mb-4 flex-col sm:flex-row gap-1">
          <h2 className="text-xl font-bold text-gray-800">Daftar Menu</h2>
          <button
            onClick={handleAddMenu}
            className="bg-unpas-gold text-white px-4 py-2 text-sm sm:text-base rounded-lg font-medium hover:bg-unpas-gold/90 transition-colors cursor-pointer"
          >
            + Tambah Menu
          </button>
        </div>

        <MenuTable
          menus={menus}
          isLoading={isLoading}
          onEdit={handleEditMenu}
          onDelete={handleDeleteMenu}
        />
      </div>

      <MenuFormModal
        isOpen={showMenuModal}
        editingMenu={editingMenu}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMenu}
        isSaving={isSavingMenu}
      />
    </>
  );
}
