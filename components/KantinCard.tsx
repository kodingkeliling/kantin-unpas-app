'use client';

import Link from 'next/link';
import { Kantin } from '@/types';

interface KantinCardProps {
  kantin: Kantin;
}

export default function KantinCard({ kantin }: KantinCardProps) {
  return (
    <Link
      href={`/kantin/${kantin.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="h-48 from-unpas-blue/20 to-unpas-gold/20 flex items-center justify-center">
        {kantin.image ? (
          <img src={kantin.image} alt={kantin.name} className="w-full h-full object-cover" />
        ) : (
          <svg
            className="w-20 h-20 text-unpas-blue/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{kantin.name}</h3>
        {kantin.description && (
          <p className="text-gray-600 text-sm mb-3">{kantin.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-unpas-blue">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{kantin.menus.length} Menu Tersedia</span>
        </div>
      </div>
    </Link>
  );
}

