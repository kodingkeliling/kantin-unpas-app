'use client';

import Image from 'next/image';
import { KantinAccount, getDayName } from '@/lib/kantin';
import { TbEdit } from 'react-icons/tb';
import { IoIosLogOut } from 'react-icons/io';
import { MdEmail } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { HiDocumentText, HiExternalLink } from 'react-icons/hi';
import LoadingSpinner from '@/components/LoadingSpinner';

interface KantinProfileCardProps {
  kantinData: KantinAccount;
  isUpdatingStatus: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
  onToggleStatus: () => void;
}

export default function KantinProfileCard({
  kantinData,
  isUpdatingStatus,
  onEditProfile,
  onLogout,
  onToggleStatus,
}: KantinProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {kantinData.coverImage && (
          <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden">
            <Image
              src={kantinData.coverImage}
              alt={kantinData.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{kantinData.name}</h1>
              {kantinData.description && (
                <p className="text-gray-600 mb-2">{kantinData.description}</p>
              )}
              <div className="space-y-1 text-sm text-gray-600">
                {kantinData.email && (
                  <p className="flex items-center gap-2">
                    <MdEmail className="w-4 h-4 text-gray-500" />
                    <span>{kantinData.email}</span>
                  </p>
                )}
                {kantinData.whatsapp && (
                  <p className="flex items-center gap-2">
                    <FaWhatsapp className="w-4 h-4 text-green-600" />
                    <span>{kantinData.whatsapp}</span>
                  </p>
                )}
                {kantinData.spreadsheetUrl && (
                  <a
                    href={kantinData.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-unpas-blue hover:text-unpas-blue/80 hover:underline transition-colors"
                  >
                    <HiDocumentText className="w-4 h-4" />
                    <span>Spreadsheet</span>
                    <HiExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {kantinData.operatingHours && kantinData.operatingHours.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Jam Operasional:</h3>
                  <div className="flex flex-wrap gap-2">
                    {kantinData.operatingHours
                      .filter(hour => hour.isOpen)
                      .map((hour, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-unpas-blue/10 text-unpas-blue rounded-full text-xs font-medium border border-unpas-blue/20"
                        >
                          <span className="font-semibold">{getDayName(hour.day)}</span>
                          <span className="text-unpas-blue/70">•</span>
                          <span>{hour.open} - {hour.close}</span>
                        </span>
                      ))}
                    {kantinData.operatingHours.filter(hour => hour.isOpen).length === 0 && (
                      <span className="text-xs text-gray-500">Tidak ada jam operasional yang diatur</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEditProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2 w-full"
              >
                <TbEdit className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {isUpdatingStatus ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={kantinData.isOpen ?? false}
                  onChange={onToggleStatus}
                  disabled={isUpdatingStatus}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-unpas-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-unpas-gold"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {kantinData.isOpen ? 'Buka' : 'Tutup'}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

