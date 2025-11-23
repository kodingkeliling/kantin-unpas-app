'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { KantinAccount, OperatingHours, getDayName, getDayNumber } from '@/lib/kantin';
import { getAccessToken } from '@/lib/googleAuth';
import { auth } from '@/lib/auth';
import GoogleDriveConnect from '@/components/GoogleDriveConnect';
import { showAlert } from '@/lib/swal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface KantinProfileModalProps {
  isOpen: boolean;
  kantinData: KantinAccount;
  onClose: () => void;
  onUpdate: (updatedData: KantinAccount) => void;
}

export default function KantinProfileModal({
  isOpen,
  kantinData,
  onClose,
  onUpdate,
}: KantinProfileModalProps) {
  const defaultHours: OperatingHours[] = [
    { day: 1, open: '08:00', close: '17:00', isOpen: true }, // Senin
    { day: 2, open: '08:00', close: '17:00', isOpen: true }, // Selasa
    { day: 3, open: '08:00', close: '17:00', isOpen: true }, // Rabu
    { day: 4, open: '08:00', close: '17:00', isOpen: true }, // Kamis
    { day: 5, open: '08:00', close: '17:00', isOpen: true }, // Jumat
    { day: 6, open: '08:00', close: '17:00', isOpen: false }, // Sabtu
    { day: 7, open: '08:00', close: '17:00', isOpen: false }, // Minggu
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    whatsapp: '',
    coverImage: '',
    operatingHours: defaultHours,
  });
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageMethod, setCoverImageMethod] = useState<'upload' | 'url'>('upload');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  useEffect(() => {
    if (isOpen && kantinData) {
      // Convert operatingHours from string to number if needed (for backward compatibility)
      // Ensure we always have 7 days (Senin-Minggu)
      let convertedHours = defaultHours;
      
      if (kantinData.operatingHours && Array.isArray(kantinData.operatingHours) && kantinData.operatingHours.length > 0) {
        // Convert existing hours and merge with defaults
        const converted = kantinData.operatingHours.map(h => ({
          ...h,
          day: typeof h.day === 'string' ? getDayNumber(h.day) : (typeof h.day === 'number' ? h.day : 1),
        }));
        
        // Merge with defaults to ensure all 7 days are present
        convertedHours = defaultHours.map(defaultHour => {
          const existing = converted.find(c => c.day === defaultHour.day);
          return existing || defaultHour;
        });
      }
      
      setFormData({
        name: kantinData.name,
        description: kantinData.description || '',
        whatsapp: kantinData.whatsapp || '',
        coverImage: kantinData.coverImage || '',
        operatingHours: convertedHours,
      });
      const coverUrl = kantinData.coverImage || '';
      setCoverImagePreview(coverUrl || null);
      setCoverImageUrl(coverUrl);
      setCoverImageMethod(coverUrl ? 'url' : 'upload');
      checkGoogleDriveConnection();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, kantinData]);

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

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setCoverImagePreview(null);
    setIsUploadingCover(true);

    const accessToken = getAccessToken();
    if (!accessToken) {
      showAlert.warning('Harap hubungkan ke Google Drive terlebih dahulu dengan menekan tombol "Hubungkan ke Google Drive" di bawah');
      setIsUploadingCover(false);
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      showAlert.warning('Harap isi nama kantin');
      return;
    }

    setIsSubmitting(true);
    const token = auth.getToken();

    if (!token) {
      showAlert.error('Token tidak ditemukan. Silakan login kembali.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/kantin/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          whatsapp: formData.whatsapp,
          coverImage: formData.coverImage,
          operatingHours: formData.operatingHours,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        showAlert.error(result.error || 'Gagal mengupdate profile');
        setIsSubmitting(false);
        return;
      }

      onUpdate(result.data);
      showAlert.successToast('Profile berhasil diupdate!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert.error('Terjadi kesalahan saat mengupdate profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-100"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 rounded-md">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky Top */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-md">
            <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <form id="profile-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kantin <span className="text-red-500">*</span>
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
                  Email
                </label>
                <input
                  type="email"
                  value={kantinData.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="kantin@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email hanya dapat diubah oleh Super Admin
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
                  💡 Hubungkan sekali untuk mengupload cover. Token akan tersimpan dan bisa digunakan untuk multiple uploads.
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
                  Cover Kantin
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Operasional
                </label>
                <div className="space-y-2">
                  {formData.operatingHours && formData.operatingHours.length > 0 ? (
                    formData.operatingHours.map((hour, index) => (
                      <div key={hour.day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <input
                            type="checkbox"
                            checked={hour.isOpen}
                            onChange={(e) => {
                              const updated = [...formData.operatingHours];
                              updated[index] = { ...hour, isOpen: e.target.checked };
                              setFormData({ ...formData, operatingHours: updated });
                            }}
                            className="w-4 h-4 text-unpas-gold border-gray-300 rounded focus:ring-unpas-gold"
                          />
                          <span className="text-sm font-medium text-gray-700 min-w-[70px]">
                            {getDayName(hour.day)}
                          </span>
                        </div>
                        {hour.isOpen ? (
                          <>
                            <input
                              type="time"
                              value={hour.open}
                              onChange={(e) => {
                                const updated = [...formData.operatingHours];
                                updated[index] = { ...hour, open: e.target.value };
                                setFormData({ ...formData, operatingHours: updated });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={hour.close}
                              onChange={(e) => {
                                const updated = [...formData.operatingHours];
                                updated[index] = { ...hour, close: e.target.value };
                                setFormData({ ...formData, operatingHours: updated });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-unpas-gold"
                            />
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Tutup</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada data jam operasional</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Atur jam operasional untuk setiap hari
                </p>
              </div>
            </form>
          </div>
          {/* Footer - Sticky Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 z-10 rounded-b-md">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="profile-form"
              className="flex-1 bg-unpas-gold text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              disabled={isUploadingCover || isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="md" className="text-white" />
              ) : isUploadingCover ? (
                'Mengupload...'
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

