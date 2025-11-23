'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GoogleDriveConnect from '@/components/GoogleDriveConnect';
import { storage } from '@/lib/storage';
import { getAccessToken } from '@/lib/googleAuth';
import { CartItem } from '@/types';
import { formatCurrency, generateTransactionCode } from '@/lib/utils';
import { showAlert } from '@/lib/swal';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart] = useState<Record<string, CartItem>>(() => {
    const savedCart = storage.cart.get();
    if (Object.keys(savedCart).length === 0) {
      if (typeof window !== 'undefined') {
        router.push('/kantin');
      }
      return {};
    }
    return savedCart;
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [kantinName] = useState(() => {
    if (typeof window === 'undefined') return '';
    const kantinId = localStorage.getItem('current_kantin_id');
    if (kantinId) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mockKantins } = require('@/lib/data');
      const kantin = mockKantins.find((k: { id: string }) => k.id === kantinId);
      return kantin ? kantin.name : '';
    }
    return '';
  });

  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      showAlert.warning('Harap upload bukti pembayaran');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      showAlert.warning('Harap hubungkan ke Google Drive terlebih dahulu untuk mengupload bukti pembayaran');
      return;
    }

    setIsUploading(true);
    let finalPaymentProofUrl = paymentProofPreview || '';

    try {
      // Upload to Google Drive
      const formData = new FormData();
      formData.append('file', paymentProof);
      formData.append('accessToken', accessToken);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (uploadResult.success && uploadResult.data) {
        finalPaymentProofUrl = uploadResult.data.url;
        setUploadedFileUrl(uploadResult.data.url);
      } else {
        console.error('Upload error:', uploadResult.error);
        showAlert.error('Gagal mengupload bukti pembayaran ke Google Drive. Silakan coba lagi.');
        setIsUploading(false);
        return;
      }
    } catch (error) {
      console.error('Upload error:', error);
      showAlert.error('Gagal mengupload bukti pembayaran. Silakan coba lagi.');
      setIsUploading(false);
      return;
    }

    const transactionCode = generateTransactionCode();
    const kantinId = localStorage.getItem('current_kantin_id') || 'unknown';
    const now = new Date();
    const transactionId = `txn-${now.getTime()}`;
    
    // Get delivery location
    const deliveryLocation = storage.deliveryLocation.get();

    const transaction = {
      id: transactionId,
      code: transactionCode,
      kantinId,
      kantinName: kantinName || 'Kantin',
      items: Object.values(cart),
      total,
      paymentProof: finalPaymentProofUrl,
      deliveryLocation: deliveryLocation || undefined,
      status: 'pending' as const,
      createdAt: now.toISOString(),
    };

    // Save to localStorage as backup
    storage.transactions.save(transaction);

    // Get kantin spreadsheet URL
    const { kantinStorage } = require('@/lib/kantin');
    const { mockKantins } = require('@/lib/data');
    const kantin = kantinStorage.getAll().find((k: any) => k.id === kantinId);
    const mockKantin = mockKantins.find((k: any) => k.id === kantinId);
    const spreadsheetApiUrl = kantin?.spreadsheetApiUrl || mockKantin?.spreadsheetApiUrl;

    // Save to Google Sheets if spreadsheet API URL is available
    if (spreadsheetApiUrl) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptUrl: spreadsheetApiUrl,
            transaction,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Failed to save to Google Sheets:', result.error);
          // Continue anyway, data is saved in localStorage
        }
      } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        // Continue anyway, data is saved in localStorage
      }
    }

    storage.cart.clear();
    localStorage.removeItem('current_kantin_id');
    setIsUploading(false);

    router.push(`/riwayat?code=${transactionCode}&kantinId=${kantinId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Pesanan</h2>
              
              {storage.deliveryLocation.get() && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 mb-1">Lokasi Pengiriman</p>
                      <p className="text-base font-semibold text-gray-800">
                        {storage.deliveryLocation.get()?.name} - {storage.deliveryLocation.get()?.tableNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!storage.deliveryLocation.get() && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800">
                        Belum ada lokasi pengiriman. Silakan scan QR code di halaman beranda untuk menentukan lokasi pengiriman.
                      </p>
                      <Link
                        href="/"
                        className="text-sm text-yellow-700 underline mt-1 inline-block"
                      >
                        Kembali ke halaman beranda →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3 mb-4">
                {Object.values(cart).map((item) => (
                  <div key={item.menuId} className="flex items-center justify-between border-b pb-3">
                    <div>
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
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-semibold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-unpas-blue">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Bukti Pembayaran</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Koneksi Google Drive
                  </label>
                  <GoogleDriveConnect />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Bukti Pembayaran
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-unpas-blue file:text-white hover:file:bg-unpas-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    File akan diupload ke Google Drive setelah Anda klik Konfirmasi Pesanan
                  </p>
                </div>
                {paymentProofPreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={paymentProofPreview}
                      alt="Bukti pembayaran"
                      className="max-w-full h-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                {uploadedFileUrl && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">
                      ✓ Bukti pembayaran berhasil diupload ke Google Drive
                    </p>
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Lihat di Google Drive →
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/kantin"
                className="flex-1 bg-gray-200 text-gray-800 text-center px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-unpas-blue text-white px-4 py-3 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengupload...
                  </>
                ) : (
                  'Konfirmasi Pesanan'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

