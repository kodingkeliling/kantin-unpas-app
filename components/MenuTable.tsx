'use client';

import { Menu } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TbEdit } from 'react-icons/tb';
import { LuTrash2 } from 'react-icons/lu';
import { FaUtensils, FaBoxOpen } from 'react-icons/fa';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface MenuTableProps {
  menus: Menu[];
  isLoading: boolean;
  onEdit: (menu: Menu) => void;
  onDelete: (id: string) => void;
}

export default function MenuTable({ menus, isLoading, onEdit, onDelete }: MenuTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={5} cols={7} />;
  }

  if (menus.length === 0) {
    return <p className="text-gray-500 text-center py-8">Belum ada menu</p>;
  }

  return (
    <div className="relative overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-sm text-gray-700 bg-gray-100 border-b border-gray-200">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">
              Gambar
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Nama Menu
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Deskripsi
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Harga
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Jumlah
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {menus.map((menu, index) => (
            <tr
              key={menu.id}
              className={`bg-white border-b border-gray-200 hover:bg-gray-50 ${
                index === menus.length - 1 ? '' : 'border-b'
              }`}
            >
              <td className="px-6 py-4">
                {menu.image ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image and show placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FaUtensils className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </td>
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {menu.name}
              </th>
              <td className="px-6 py-4 text-gray-600 max-w-xs">
                <div className="truncate" title={menu.description || '-'}>
                  {menu.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600">
                {formatCurrency(menu.price)}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {menu.quantity !== undefined ? menu.quantity : <FaBoxOpen className="w-5 h-5 text-gray-400 inline" title="Tidak Terbatas" />}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    menu.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {menu.available ? 'Tersedia' : 'Tidak Tersedia'}
                </span>
              </td>
              <td className="flex items-center px-6 py-4 gap-2">
                <button
                  onClick={() => onEdit(menu)}
                  className="p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Edit"
                >
                  <TbEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(menu.id)}
                  className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

