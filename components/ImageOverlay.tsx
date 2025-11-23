'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IoClose } from 'react-icons/io5';

interface ImageOverlayProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageOverlay({ imageUrl, onClose }: ImageOverlayProps) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-100 flex items-center justify-center p-4"
        onClick={() => {
          onClose();
          setImageError(false);
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            setImageError(false);
          }}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
          aria-label="Tutup"
        >
          <IoClose className="w-6 h-6" />
        </button>
        
        {/* Image Container */}
        <div
          key={imageUrl}
          className="relative max-w-4xl max-h-[90vh] w-full h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {imageError ? (
            <div className="text-white text-center p-8">
              <p className="text-lg">Gagal memuat gambar</p>
              <p className="text-sm text-gray-300 mt-2">URL gambar tidak valid atau tidak dapat diakses</p>
            </div>
          ) : (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt="Bukti pembayaran"
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              onError={() => {
                console.error('Image load error:', imageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl);
                setImageError(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

