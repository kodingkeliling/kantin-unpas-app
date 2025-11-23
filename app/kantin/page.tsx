'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import KantinCard from '@/components/KantinCard';
import { mockKantins } from '@/lib/data';
import { Kantin } from '@/types';

export default function KantinPage() {
  const [kantins] = useState<Kantin[]>(mockKantins);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Daftar Kantin</h1>
          <p className="text-sm sm:text-base text-gray-600">Pilih kantin untuk melihat menu yang tersedia</p>
        </div>

        {kantins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada kantin tersedia saat ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {kantins.map((kantin) => (
              <KantinCard key={kantin.id} kantin={kantin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

