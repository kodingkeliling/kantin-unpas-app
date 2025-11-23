'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import KantinCard from '@/components/KantinCard';
import { getKantinsFromSuperAdminSheet } from '@/lib/googleScript';
import { kantinStorage, KantinAccount } from '@/lib/kantin';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function KantinPage() {
  const [kantins, setKantins] = useState<KantinAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKantins = async () => {
      setIsLoading(true);
      
      // Load from localStorage first (for quick display)
      const allKantins = kantinStorage.getAll();
      // Filter only open kantins for public display
      const openKantins = allKantins.filter(k => k.isOpen !== false);
      setKantins(openKantins);
      setIsLoading(false);

      // Then try to load from Google Sheets
      try {
        const response = await getKantinsFromSuperAdminSheet();
        if (response.success && response.data?.data) {
          const kantinsFromSheet = response.data.data as KantinAccount[];
          
          // Log kantins data for debugging
          console.log('Kantins loaded from sheet:', kantinsFromSheet);
          kantinsFromSheet.forEach(k => {
            console.log(`Kantin: ${k.name}, coverImage: ${k.coverImage}`);
          });
          
          // Replace all data in localStorage with fresh data from API
          kantinStorage.replaceAll(kantinsFromSheet);
          
          // Filter only open kantins for public display
          const openKantinsFromSheet = kantinsFromSheet.filter(k => k.isOpen !== false);
          setKantins(openKantinsFromSheet);
        }
      } catch (error) {
        console.error('Error loading kantins from sheet:', error);
        // Continue with localStorage data
      } finally {
        setIsLoading(false);
      }
    };

    loadKantins();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Daftar Kantin</h1>
          <p className="text-sm sm:text-base text-gray-600">Pilih kantin untuk melihat menu yang tersedia</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : kantins.length === 0 ? (
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

