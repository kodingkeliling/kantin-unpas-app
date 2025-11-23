'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { KantinAccount } from '@/lib/kantin';
import { getAccessToken } from '@/lib/googleAuth';
import GoogleDriveConnect from '@/components/GoogleDriveConnect';
import { showAlert } from '@/lib/swal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface KantinFormModalProps {
  isOpen: boolean;
  editingKantin: KantinAccount | null;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    description: string;
    password: string;
    spreadsheetApiUrl: string;
    spreadsheetUrl: string;
    email: string;
    whatsapp: string;
    coverImage: string;
    qrisImage: string;
  }) => void;
  isSubmitting?: boolean;
}

export default function KantinFormModal({
  isOpen,
  editingKantin,
  onClose,
  onSubmit,
  isSubmitting = false,
}: KantinFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    password: '',
    spreadsheetApiUrl: '',
    spreadsheetUrl: '',
    email: '',
    whatsapp: '',
    coverImage: '',
    qrisImage: '',
  });
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [qrisImagePreview, setQrisImagePreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [coverImageMethod, setCoverImageMethod] = useState<'upload' | 'url'>('upload');
  const [qrisImageMethod, setQrisImageMethod] = useState<'upload' | 'url'>('upload');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkGoogleDriveConnection();
      if (editingKantin) {
        setFormData({
          name: editingKantin.name,
          description: editingKantin.description || '',
          password: editingKantin.password,
          spreadsheetApiUrl: editingKantin.spreadsheetApiUrl || '',
          spreadsheetUrl: editingKantin.spreadsheetUrl || '',
          email: editingKantin.email || '',
          whatsapp: editingKantin.whatsapp || '',
          coverImage: editingKantin.coverImage || '',
          qrisImage: editingKantin.qrisImage || '',
        });
        const coverUrl = editingKantin.coverImage || '';
        const qrisUrl = editingKantin.qrisImage || '';
        setCoverImagePreview(coverUrl || null);
        setQrisImagePreview(qrisUrl || null);
        setCoverImageUrl(coverUrl);
        setQrisImageUrl(qrisUrl);
        setCoverImageMethod(coverUrl ? 'url' : 'upload');
        setQrisImageMethod(qrisUrl ? 'url' : 'upload');
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingKantin]);

  // Prevent body scroll when modal is open
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

  const checkGoogleDriveConnection = () => {
    const token = getAccessToken();
    setIsGoogleDriveConnected(!!token);
  };

  const handleGoogleDriveConnected = () => {
    checkGoogleDriveConnection();
  };

  const validateImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleCoverImageUrlChange = (url: string) => {
    setCoverImageUrl(url);
    if (url && validateImageUrl(url)) {
      setFormData((prev) => ({ ...prev, coverImage: url }));
      setCoverImagePreview(url);
    } else if (url) {
      setCoverImagePreview(null);
    }
  };

  const handleQrisImageUrlChange = (url: string) => {
    setQrisImageUrl(url);
    if (url && validateImageUrl(url)) {
      setFormData((prev) => ({ ...prev, qrisImage: url }));
      setQrisImagePreview(url);
    } else if (url) {
      setQrisImagePreview(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', password: '', spreadsheetApiUrl: '', spreadsheetUrl: '', email: '', whatsapp: '', coverImage: '', qrisImage: '' });
    setCoverImagePreview(null);
    setQrisImagePreview(null);
    setCoverImageMethod('upload');
    setQrisImageMethod('upload');
    setCoverImageUrl('');
    setQrisImageUrl('');
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      showAlert.warning('Tidak ada file yang dipilih');
      return;
    }

    // Validate file
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
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const accessToken = getAccessToken();
    if (!accessToken) {
      showAlert.warning('Harap hubungkan ke Google Drive terlebih dahulu dengan menekan tombol "Hubungkan ke Google Drive" di bawah');
      return;
    }

    setIsUploadingCover(true);
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
        let errorMessage = 'Gagal mengupload gambar cover.';
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
        setFormData((prev) => ({ ...prev, coverImage: uploadResult.data.url }));
        setCoverImagePreview(uploadResult.data.url);
        showAlert.successToast('Gambar cover berhasil diupload!');
      } else {
        console.error('Upload error:', uploadResult.error);
        showAlert.error(uploadResult.error || 'Gagal mengupload gambar cover. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload gambar cover. Silakan coba lagi.';
      showAlert.error(errorMessage);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleQrisImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      showAlert.warning('Tidak ada file yang dipilih');
      return;
    }

    // Validate file
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

    // Don't show preview until upload is successful
    // Remove preview immediately when new file is selected
    setQrisImagePreview(null);

    const accessToken = getAccessToken();
    if (!accessToken) {
      showAlert.warning('Harap hubungkan ke Google Drive terlebih dahulu dengan menekan tombol "Hubungkan ke Google Drive" di bawah');
      return;
    }

    setIsUploadingQris(true);
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
        let errorMessage = 'Gagal mengupload gambar QRIS.';
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
        setFormData((prev) => ({ ...prev, qrisImage: uploadResult.data.url }));
        setQrisImagePreview(uploadResult.data.url);
        showAlert.successToast('Gambar QRIS berhasil diupload!');
      } else {
        console.error('Upload error:', uploadResult.error);
        showAlert.error(uploadResult.error || 'Gagal mengupload gambar QRIS. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload gambar QRIS. Silakan coba lagi.';
      showAlert.error(errorMessage);
    } finally {
      setIsUploadingQris(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.password) {
      showAlert.warning('Harap isi nama dan password');
      return;
    }

    if (!formData.spreadsheetApiUrl) {
      showAlert.warning('Harap isi URL Spreadsheet API untuk kantin ini');
      return;
    }

    if (!formData.email) {
      showAlert.warning('Harap isi email untuk kantin ini');
      return;
    }

    if (!formData.coverImage) {
      showAlert.warning('Harap upload atau paste URL gambar cover kantin');
      return;
    }

    if (!formData.qrisImage) {
      showAlert.warning('Harap upload atau paste URL gambar QRIS pembayaran');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-100"
        onClick={() => {
          resetForm();
          onClose();
        }}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 rounded-md">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky Top */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-md">
            <h3 className="text-xl font-bold text-gray-800">
              {editingKantin ? 'Edit Akun Kantin' : 'Buat Akun Kantin Baru'}
            </h3>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <form id="kantin-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kantin
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="Contoh: Kantin Utama"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  rows={2}
                  placeholder="Deskripsi kantin..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="kantin@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email untuk menerima notifikasi ketika ada pesanan baru
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="Password untuk login kantin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Spreadsheet API <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.spreadsheetApiUrl}
                  onChange={(e) => setFormData({ ...formData, spreadsheetApiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL Google Apps Script untuk spreadsheet kantin ini (untuk menyimpan data transaksi)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Spreadsheet
                </label>
                <input
                  type="url"
                  value={formData.spreadsheetUrl}
                  onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL Google Spreadsheet untuk melihat data (opsional)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                  placeholder="081234567890"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nomor WhatsApp untuk kontak kantin (opsional)
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Connection
                </label>
                <GoogleDriveConnect 
                  onConnected={handleGoogleDriveConnected}
                  onDisconnected={handleGoogleDriveConnected}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Hubungkan sekali untuk mengupload cover dan QRIS. Token akan tersimpan dan bisa digunakan untuk multiple uploads.
                </p>
                {isGoogleDriveConnected && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Google Drive terhubung - Siap untuk upload
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Kantin <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCoverImageMethod('upload')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      coverImageMethod === 'upload'
                        ? 'bg-unpas-gold text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Upload Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageMethod('url')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      coverImageMethod === 'url'
                        ? 'bg-unpas-gold text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
                {coverImageMethod === 'upload' ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      id="cover-image-upload"
                      className="hidden"
                      disabled={isUploadingCover}
                    />
                    <label
                      htmlFor="cover-image-upload"
                      className={`relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingCover
                          ? 'border-unpas-blue bg-unpas-blue/5'
                          : coverImagePreview || formData.coverImage
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-unpas-blue hover:bg-unpas-blue/5'
                      }`}
                    >
                      {isUploadingCover ? (
                        <div className="flex flex-col items-center gap-3">
                          <LoadingSpinner size="lg" />
                          <p className="text-sm text-unpas-blue font-medium">Mengupload...</p>
                        </div>
                      ) : coverImagePreview || formData.coverImage ? (
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <Image
                            src={coverImagePreview || formData.coverImage || ''}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                            onError={() => {
                              setCoverImagePreview(null);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium">Klik untuk upload gambar</p>
                          <p className="text-xs">atau drag & drop</p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => handleCoverImageUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold text-sm"
                  />
                )}
                {coverImageMethod === 'url' && (coverImagePreview || formData.coverImage) && (
                  <div className="mt-2">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={coverImagePreview || formData.coverImage || ''}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        onError={() => {
                          setCoverImagePreview(null);
                          showAlert.error('URL gambar tidak valid atau tidak dapat diakses');
                        }}
                      />
                    </div>
                  </div>
                )}
                {!formData.coverImage && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Cover kantin wajib diisi</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Gambar cover untuk tampilan kantin (wajib)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QRIS Pembayaran <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setQrisImageMethod('upload')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      qrisImageMethod === 'upload'
                        ? 'bg-unpas-gold text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Upload Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrisImageMethod('url')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      qrisImageMethod === 'url'
                        ? 'bg-unpas-gold text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
                {qrisImageMethod === 'upload' ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisImageChange}
                      id="qris-image-upload"
                      className="hidden"
                      disabled={isUploadingQris}
                      required={!formData.qrisImage}
                    />
                    <label
                      htmlFor="qris-image-upload"
                      className={`relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingQris
                          ? 'border-unpas-blue bg-unpas-blue/5'
                          : qrisImagePreview || formData.qrisImage
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-unpas-blue hover:bg-unpas-blue/5'
                      }`}
                    >
                      {isUploadingQris ? (
                        <div className="flex flex-col items-center gap-3">
                          <LoadingSpinner size="lg" />
                          <p className="text-sm text-unpas-blue font-medium">Mengupload...</p>
                        </div>
                      ) : qrisImagePreview || formData.qrisImage ? (
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <Image
                            src={qrisImagePreview || formData.qrisImage || ''}
                            alt="QRIS preview"
                            fill
                            className="object-cover"
                            onError={() => {
                              setQrisImagePreview(null);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium">Klik untuk upload gambar</p>
                          <p className="text-xs">atau drag & drop</p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={qrisImageUrl}
                    onChange={(e) => handleQrisImageUrlChange(e.target.value)}
                    placeholder="https://example.com/qris.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-unpas-gold text-sm"
                    required={!formData.qrisImage}
                  />
                )}
                {!formData.qrisImage && (
                  <p className="text-xs text-red-500 mt-1">⚠️ QRIS pembayaran wajib diisi</p>
                )}
                {qrisImageMethod === 'url' && (qrisImagePreview || formData.qrisImage) && (
                  <div className="mt-2">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={qrisImagePreview || formData.qrisImage || ''}
                        alt="QRIS preview"
                        fill
                        className="object-cover"
                        onError={() => {
                          setQrisImagePreview(null);
                          showAlert.error('URL gambar tidak valid atau tidak dapat diakses');
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Gambar QRIS untuk pembayaran (wajib)
                </p>
              </div>
            </form>
          </div>
          {/* Footer - Sticky Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 z-10 rounded-b-md">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="kantin-form"
              className="flex-1 bg-unpas-gold text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              disabled={isUploadingCover || isUploadingQris || isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="md" className="text-white" />
              ) : isUploadingCover || isUploadingQris ? (
                'Mengupload...'
              ) : editingKantin ? (
                'Update Akun Kantin'
              ) : (
                'Buat Akun Kantin'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
