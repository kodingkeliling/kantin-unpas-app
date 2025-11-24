'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IoIosLogOut } from 'react-icons/io';
import { auth } from '@/lib/auth';
import { TbFileInvoice } from "react-icons/tb";
import { TbBuildingStore } from "react-icons/tb";

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-90 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <Image
                  src="https://www.unpas.ac.id/wp-content/uploads/2016/10/Logo-Unpas.png"
                  alt="UNPAS Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-base sm:text-xl font-bold text-unpas-blue">E-Kantin UNPAS</span>
            </Link>
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-2"
              >
                <IoIosLogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            ) : (
              <nav className="flex items-center gap-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/'
                      ? 'bg-unpas-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Beranda
                </Link>
                <Link
                  href="/kantin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/kantin'
                      ? 'bg-unpas-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Kantin
                </Link>
                <Link
                  href="/riwayat"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/riwayat'
                      ? 'bg-unpas-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Riwayat
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Hidden for Admin */}
      {!isAdmin && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-90 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16">

          <Link
            href="/kantin"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/kantin' || pathname.startsWith('/kantin/')
                ? 'text-unpas-blue'
                : 'text-gray-600'
            }`}
          >
            <TbBuildingStore className="w-6 h-6" />
            <span className="text-xs font-medium">Kantin</span>
          </Link>

          {/* Logo UNPAS di tengah */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center flex-1 h-full transition-opacity hover:opacity-80"
          >
            <div className="relative w-10 h-10 mb-1">
              <Image
                src="https://www.unpas.ac.id/wp-content/uploads/2016/10/Logo-Unpas.png"
                alt="UNPAS Logo"
                fill
                className="object-contain"
              />
            </div>
            {/* <span className="text-xs font-medium text-gray-600">Beranda</span> */}
          </Link>

          <Link
            href="/riwayat"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/riwayat'
                ? 'text-unpas-blue'
                : 'text-gray-600'
            }`}
          >
           <TbFileInvoice className="w-6 h-6" />
            <span className="text-xs font-medium">Riwayat</span>
          </Link>
        </div>
      </nav>
      )}

      {/* Mobile Header for Admin */}
      {isAdmin && (
        <header className="md:hidden sticky top-0 z-90 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <Image
                    src="https://www.unpas.ac.id/wp-content/uploads/2016/10/Logo-Unpas.png"
                    alt="UNPAS Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-base font-bold text-unpas-blue">E-Kantin</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <IoIosLogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header>
      )}

    </>
  );
}
