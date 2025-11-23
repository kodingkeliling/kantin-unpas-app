'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu } from '@/types';
import { showAlert } from '@/lib/swal';
import { getAccessToken } from '@/lib/googleAuth';
import GoogleDriveConnect from '@/components/GoogleDriveConnect';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaImage } from 'react-icons/fa';

interface MenuFormProps {
  editingMenu: Menu | null;
  formData: {
    name: string;
    description: string;
    price: string;
    priceRaw: string;
    available: boolean;
    quantity: string;
    image: string;
  };
  menuImagePreview: string | null;
  menuImageMethod: 'upload' | 'url';
  menuImageUrl: string;
  isUploadingMenuImage: boolean;
  isGoogleDriveConnected: boolean;
  onFormDataChange: (data: Partial<MenuFormProps['formData']>) => void;
  onMenuImageMethodChange: (method: 'upload' | 'url') => void;
  onMenuImageUrlChange: (url: string) => void;
  onMenuImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoogleDriveConnectionChange: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function MenuForm({
  editingMenu,
  formData,
  menuImagePreview,
  menuImageMethod,
  menuImageUrl,
  isUploadingMenuImage,
  isGoogleDriveConnected,
  onFormDataChange,
  onMenuImageMethodChange,
  onMenuImageUrlChange,
  onMenuImageChange,
  onGoogleDriveConnectionChange,
  onSubmit,
  onCancel,
  isSaving,
}: MenuFormProps) {
  // Format rupiah for display
  const formatRupiah = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(numericValue)).replace('Rp', 'Rp ');
  };

  // Handle price input change
  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    onFormDataChange({
      price: formatRupiah(numericValue),
      priceRaw: numericValue,
    });
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Menu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
            placeholder="Nama menu"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
            placeholder="Rp 0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah/Stock
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => onFormDataChange({ quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
            placeholder="Jumlah tersedia"
            min="0"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
            rows={2}
            placeholder="Deskripsi menu"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Drive Connection
          </label>
          <GoogleDriveConnect 
            onConnected={onGoogleDriveConnectionChange}
            onDisconnected={onGoogleDriveConnectionChange}
          />
          {isGoogleDriveConnected && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Google Drive terhubung - Siap untuk upload
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Menu
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                onMenuImageMethodChange('upload');
                onFormDataChange({ image: '' });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                menuImageMethod === 'upload'
                  ? 'bg-unpas-gold text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload Gambar
            </button>
            <button
              type="button"
              onClick={() => {
                onMenuImageMethodChange('url');
                onFormDataChange({ image: '' });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                menuImageMethod === 'url'
                  ? 'bg-unpas-gold text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Paste URL
            </button>
          </div>
          {menuImageMethod === 'upload' ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={onMenuImageChange}
                id="menu-image-upload"
                className="hidden"
                disabled={isUploadingMenuImage}
              />
              <label
                htmlFor="menu-image-upload"
                className={`relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingMenuImage
                    ? 'border-unpas-blue bg-unpas-blue/5'
                    : menuImagePreview || formData.image
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-unpas-blue hover:bg-unpas-blue/5'
                }`}
              >
                {isUploadingMenuImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-unpas-blue font-medium">Mengupload...</p>
                  </div>
                ) : menuImagePreview || formData.image ? (
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <Image
                      src={menuImagePreview || formData.image || ''}
                      alt="Menu preview"
                      fill
                      className="object-cover"
                      onError={() => {
                        // Handle error in parent
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FaImage className="w-12 h-12" />
                    <p className="text-sm font-medium">Klik untuk upload gambar</p>
                    <p className="text-xs">atau drag & drop</p>
                  </div>
                )}
              </label>
            </div>
          ) : (
            <input
              type="url"
              value={menuImageUrl}
              onChange={(e) => onMenuImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold text-sm"
            />
          )}
          {menuImageMethod === 'url' && (menuImagePreview || formData.image) && (
            <div className="mt-2">
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={menuImagePreview || formData.image || ''}
                  alt="Menu preview"
                  fill
                  className="object-cover"
                  onError={() => {
                    showAlert.error('URL gambar tidak valid atau tidak dapat diakses');
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={(e) => onFormDataChange({ available: e.target.checked })}
              className="w-4 h-4 text-unpas-gold border-gray-300 rounded focus:ring-unpas-gold"
            />
            <span className="text-sm font-medium text-gray-700">Tersedia</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <button
            onClick={onSubmit}
            disabled={isSaving || isUploadingMenuImage}
            className="w-full bg-unpas-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>{editingMenu ? 'Update Menu' : 'Tambah Menu'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

