'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { IoMdRefresh } from "react-icons/io";
import Image from 'next/image';
import ImageOverlay from '@/components/ImageOverlay';

interface PesananTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  isUpdatingTransactionStatus: string | null;
  onRefresh: () => void;
  onStatusChange: (transactionId: string, newStatus: Transaction['status']) => void;
}

export default function PesananTable({
  transactions,
  isLoading,
  isUpdatingTransactionStatus,
  onRefresh,
  onStatusChange,
}: PesananTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const getStatusLabel = (status: Transaction['status']): string => {
    const labels: Record<Transaction['status'], string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      ready: 'Siap',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: Transaction['status']): string => {
    const colors: Record<Transaction['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={8} />;
  }

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Daftar Pesanan</h2>
        <button
          onClick={onRefresh}
          className="bg-unpas-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-blue/90 transition-colors cursor-pointer flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="text-white" />
            </>
          ) : (
            <IoMdRefresh/>
          )}
        </button>
      </div>

      <div className="relative overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
        <table className="w-full text-xs text-left text-gray-700">
          <thead className="text-xs text-gray-700 bg-gray-100 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Kode Transaksi</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Pemesan</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Items</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Total</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Lokasi Pengiriman</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Bukti Bayar</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Tanggal</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium">Status</th>
              <th scope="col" className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-medium sticky right-0 bg-gray-100 z-10">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={`bg-white border-b border-gray-200 hover:bg-gray-50 ${
                  index === transactions.length - 1 ? '' : 'border-b'
                }`}
              >
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-medium text-gray-900">
                  {transaction.code}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600">
                  {transaction.customerName ? (
                    <div>
                      <div className="font-medium">{transaction.customerName}</div>
                      {transaction.deliveryLocation ? (
                        <div className="text-xs text-gray-400">
                          {transaction.deliveryLocation.name} - Meja {transaction.deliveryLocation.tableNumber}
                        </div>
                      ) : (
                        <div className="text-xs text-green-600">Take Away</div>
                      )}
                    </div>
                  ) : transaction.deliveryLocation ? (
                    <>
                      {transaction.deliveryLocation.name}
                      {transaction.deliveryLocation.tableNumber && (
                        <span className="text-gray-400"> (Meja {transaction.deliveryLocation.tableNumber})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">Take Away</span>
                  )}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600">
                  <div className="max-w-xs">
                    {Array.isArray(transaction.items) ? (
                      <div className="space-y-0.5">
                        {transaction.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {item.quantity}x {item.menuName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600 font-medium">
                  {formatCurrency(transaction.total)}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600">
                  {transaction.deliveryLocation ? (
                    <div className="text-xs">
                      <div>{transaction.deliveryLocation.name}</div>
                      <div className="text-gray-400">Meja {transaction.deliveryLocation.tableNumber}</div>
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium text-xs">Take Away</span>
                  )}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600">
                  {transaction.paymentProof ? (
                    <button
                      onClick={() => handleImageClick(transaction.paymentProof || '')}
                      className="inline-block"
                    >
                      <Image
                        src={transaction.paymentProof}
                        alt="Bukti pembayaran"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600">
                  {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                  >
                    {getStatusLabel(transaction.status)}
                  </span>
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 sticky right-0 bg-white hover:bg-gray-50 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                  <select
                    value={transaction.status}
                    onChange={(e) => onStatusChange(transaction.id, e.target.value as Transaction['status'])}
                    disabled={isUpdatingTransactionStatus === transaction.id}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-unpas-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="processing">Diproses</option>
                    <option value="ready">Siap</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                  {isUpdatingTransactionStatus === transaction.id && (
                    <div className="mt-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Overlay Modal */}
      <ImageOverlay
        key={selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}

