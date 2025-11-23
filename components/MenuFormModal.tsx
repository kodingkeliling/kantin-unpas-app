'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Menu } from '@/types';
import { getAccessToken } from '@/lib/googleAuth';
import GoogleDriveConnect from '@/components/GoogleDriveConnect';
import { showAlert } from '@/lib/swal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaImage } from 'react-icons/fa';

interface MenuFormModalProps {
  isOpen: boolean;
  editingMenu: Menu | null;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    description: string;
    price: number;
    available: boolean;
    quantity?: number;
    image: string;
  }) => void;
  isSaving?: boolean;
}

export default function MenuFormModal({
  isOpen,
  editingMenu,
  onClose,
  onSubmit,
  isSaving = false,
}: MenuFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    priceRaw: '',
    available: true,
    quantity: '',
    image: '',
  });
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [menuImageMethod, setMenuImageMethod] = useState<'upload' | 'url'>('upload');
  const [menuImageUrl, setMenuImageUrl] = useState('');

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

  // Check Google Drive connection
  const checkGoogleDriveConnection = () => {
    const token = getAccessToken();
    setIsGoogleDriveConnected(!!token);
  };

  // Validate image URL
  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Handle menu image URL change
  const handleMenuImageUrlChange = (url: string) => {
    setMenuImageUrl(url);
    if (url && validateImageUrl(url)) {
      setFormData((prev) => ({ ...prev, image: url }));
      setMenuImagePreview(url);
    } else if (url) {
      setMenuImagePreview(null);
    }
  };

  // Handle menu image upload
  const handleMenuImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      showAlert.warning('Tidak ada file yang dipilih');
      return;
    }

    if (file.size === 0) {
      showAlert.error('File kosong. Silakan pilih file yang valid.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = file.type || '';
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidType = fileType && allowedTypes.includes(fileType);
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      showAlert.error(`Format file tidak didukung. Gunakan format: ${allowedExtensions.join(', ')}`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMenuImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const accessToken = getAccessToken();
    if (!accessToken) {
      showAlert.warning('Harap hubungkan ke Google Drive terlebih dahulu');
      return;
    }

    setIsUploadingMenuImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('accessToken', accessToken);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errorMessage = 'Gagal mengupload gambar menu.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        showAlert.error(errorMessage);
        return;
      }

      const uploadResult = await uploadResponse.json();

      if (uploadResult.success && uploadResult.data) {
        setFormData((prev) => ({ ...prev, image: uploadResult.data.url }));
        setMenuImagePreview(uploadResult.data.url);
        showAlert.successToast('Gambar menu berhasil diupload!');
      } else {
        showAlert.error(uploadResult.error || 'Gagal mengupload gambar menu.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showAlert.error('Gagal mengupload gambar menu. Silakan coba lagi.');
    } finally {
      setIsUploadingMenuImage(false);
    }
  };

  // Handle price input change
  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setFormData((prev) => ({
      ...prev,
      price: formatRupiah(numericValue),
      priceRaw: numericValue,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      priceRaw: '',
      available: true,
      quantity: '',
      image: '',
    });
    setMenuImagePreview(null);
    setMenuImageUrl('');
    setMenuImageMethod('upload');
  };

  // Initialize form when modal opens or editing menu changes
  useEffect(() => {
    if (isOpen) {
      checkGoogleDriveConnection();
      if (editingMenu) {
        setFormData({
          name: editingMenu.name,
          description: editingMenu.description || '',
          price: formatRupiah(editingMenu.price.toString()),
          priceRaw: editingMenu.price.toString(),
          available: editingMenu.available,
          quantity: editingMenu.quantity?.toString() || '',
          image: editingMenu.image || '',
        });
        if (editingMenu.image) {
          setMenuImagePreview(editingMenu.image);
          setMenuImageUrl(editingMenu.image);
          setMenuImageMethod('url');
        } else {
          setMenuImagePreview(null);
          setMenuImageUrl('');
          setMenuImageMethod('upload');
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingMenu]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.name || !formData.priceRaw) {
      showAlert.warning('Harap isi nama dan harga menu');
      return;
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.priceRaw),
      available: formData.available,
      quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      image: formData.image || '',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-100"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
            </h2>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                  onConnected={checkGoogleDriveConnection}
                  onDisconnected={checkGoogleDriveConnection}
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
                      setMenuImageMethod('upload');
                      setFormData((prev) => ({ ...prev, image: '' }));
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
                      setMenuImageMethod('url');
                      setFormData((prev) => ({ ...prev, image: '' }));
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
                      onChange={handleMenuImageChange}
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
                          {/* Use regular img for preview to avoid hostname configuration issues */}
                          <img
                            src={menuImagePreview || formData.image || ''}
                            alt="Menu preview"
                            className="w-full h-full object-cover"
                            onError={() => {
                              showAlert.error('URL gambar tidak valid atau tidak dapat diakses');
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
                  <>
                    <input
                      type="url"
                      value={menuImageUrl}
                      onChange={(e) => handleMenuImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold text-sm mb-2"
                    />
                    {menuImagePreview || formData.image ? (
                      <div className="mt-2">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          {/* Use regular img for URL previews to avoid hostname configuration issues */}
                          <img
                            src={menuImagePreview || formData.image || ''}
                            alt="Menu preview"
                            className="w-full h-full object-cover"
                            onError={() => {
                              showAlert.error('URL gambar tidak valid atau tidak dapat diakses');
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData((prev) => ({ ...prev, available: e.target.checked }))}
                    className="w-4 h-4 text-unpas-gold border-gray-300 rounded focus:ring-unpas-gold"
                  />
                  <span className="text-sm font-medium text-gray-700">Tersedia</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex items-center justify-end gap-3 bg-white">
            <button
              onClick={onClose}
              disabled={isSaving || isUploadingMenuImage}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isUploadingMenuImage}
              className="px-4 py-2 bg-unpas-blue text-white rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="text-white" />
                </>
              ) : (
                <span>{editingMenu ? 'Update Menu' : 'Tambah Menu'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

