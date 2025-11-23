'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { auth } from '@/lib/auth';
import { kantinStorage, KantinAccount } from '@/lib/kantin';
import { saveKantinToSuperAdminSheet, updateKantinInSuperAdminSheet, getKantinsFromSuperAdminSheet } from '@/lib/googleScript';
import KantinFormModal from '@/components/KantinFormModal';
import { showAlert } from '@/lib/swal';
import { LuTrash2 } from 'react-icons/lu';
import { TbEdit } from 'react-icons/tb';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [authData] = useState(auth.getAuth());
  const [kantins, setKantins] = useState<KantinAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKantin, setEditingKantin] = useState<KantinAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKantins = async () => {
    // Load from localStorage first (for quick display)
    const allKantins = kantinStorage.getAll();
    // Sort by createdAt descending (newest first)
    const sortedKantins = [...allKantins].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    setKantins(sortedKantins);

    // Then try to load from Google Sheets
    try {
      const response = await getKantinsFromSuperAdminSheet();
      if (response.success && response.data?.data) {
        const kantinsFromSheet = response.data.data as KantinAccount[];
        // Update localStorage with data from sheet
        kantinsFromSheet.forEach((kantin) => {
          kantinStorage.save(kantin);
        });
        // Sort again after loading from sheet
        const updatedKantins = kantinStorage.getAll();
        const sortedUpdatedKantins = [...updatedKantins].sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setKantins(sortedUpdatedKantins);
      }
    } catch (error) {
      console.error('Error loading kantins from sheet:', error);
      // Continue with localStorage data
    }
  };

  const resetForm = () => {
    setEditingKantin(null);
  };

  useEffect(() => {
    if (!authData || !auth.isSuperAdmin()) {
      router.push('/login');
      return;
    }

    loadKantins();
  }, [authData, router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const handleSubmitKantin = async (data: {
    name: string;
    description: string;
    email: string;
    password: string;
    spreadsheetApiUrl: string;
    spreadsheetUrl: string;
    whatsapp: string;
    coverImage: string;
    qrisImage: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingKantin) {
      // Update existing kantin
      const updatedKantin: KantinAccount = {
        ...editingKantin,
        name: data.name,
        description: data.description,
        password: data.password,
        spreadsheetApiUrl: data.spreadsheetApiUrl,
        spreadsheetUrl: data.spreadsheetUrl,
        email: data.email,
        whatsapp: data.whatsapp,
        coverImage: data.coverImage,
        qrisImage: data.qrisImage,
      };

      // Save to localStorage first
      kantinStorage.save(updatedKantin);
      // Sort by createdAt descending (newest first)
      const allKantins = kantinStorage.getAll();
      const sortedKantins = [...allKantins].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setKantins(sortedKantins);

      // Update to Google Sheets
      try {
        const response = await updateKantinInSuperAdminSheet(editingKantin.id, updatedKantin);
        if (!response.success) {
          console.error('Failed to update in Google Sheets:', response.error);
          showAlert.warning('Akun kantin berhasil diupdate di lokal, tapi gagal mengupdate di Google Sheets. Silakan coba lagi.');
        } else {
          resetForm();
          setShowAddForm(false);
          showAlert.success('Akun kantin berhasil diupdate!');
        }
      } catch (error) {
        console.error('Error updating in Google Sheets:', error);
        showAlert.warning('Akun kantin berhasil diupdate di lokal, tapi gagal mengupdate di Google Sheets. Silakan coba lagi.');
      }
      } else {
      // Create new kantin
      const newKantin: KantinAccount = {
        id: `kantin-${Date.now()}`,
        name: data.name,
        description: data.description,
        ownerId: `owner-${Date.now()}`,
        password: data.password,
        spreadsheetApiUrl: data.spreadsheetApiUrl,
        spreadsheetUrl: data.spreadsheetUrl,
        email: data.email,
        whatsapp: data.whatsapp,
        coverImage: data.coverImage,
        qrisImage: data.qrisImage,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage first (for quick feedback)
      kantinStorage.save(newKantin);
      // Sort by createdAt descending (newest first)
      const allKantins = kantinStorage.getAll();
      const sortedKantins = [...allKantins].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setKantins(sortedKantins);

      // Save to Google Sheets
      try {
        const response = await saveKantinToSuperAdminSheet(newKantin);
        if (!response.success) {
          console.error('Failed to save to Google Sheets:', response.error);
          showAlert.warning('Akun kantin berhasil dibuat di lokal, tapi gagal menyimpan ke Google Sheets. Silakan coba lagi.');
        } else {
          resetForm();
          setShowAddForm(false);
          showAlert.success('Akun kantin berhasil dibuat!');
        }
      } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        showAlert.warning('Akun kantin berhasil dibuat di lokal, tapi gagal menyimpan ke Google Sheets. Silakan coba lagi.');
      }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditKantin = (kantin: KantinAccount) => {
    setEditingKantin(kantin);
    setShowAddForm(true);
  };

  const handleDeleteKantin = async (id: string) => {
    const result = await showAlert.confirm('Yakin ingin menghapus akun kantin ini?', 'Konfirmasi Hapus', 'Ya, Hapus', 'Batal');
    if (!result.isConfirmed) return;
    
    kantinStorage.delete(id);
    // Sort by createdAt descending (newest first)
    const allKantins = kantinStorage.getAll();
    const sortedKantins = [...allKantins].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    setKantins(sortedKantins);
    showAlert.success('Akun kantin berhasil dihapus!');
  };

  if (!authData || !auth.isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
          <p>Memuat...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-600">Kelola akun kantin</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Daftar Kantin</h2>
            <button
              onClick={() => {
                if (showAddForm) {
                  resetForm();
                }
                setShowAddForm(!showAddForm);
              }}
              className="bg-unpas-gold text-white px-4 py-2 rounded-lg font-medium hover:bg-unpas-gold/90 transition-colors cursor-pointer"
            >
              + Buat Akun Kantin
            </button>
          </div>

          <KantinFormModal
            isOpen={showAddForm}
            editingKantin={editingKantin}
            onClose={() => {
              resetForm();
              setShowAddForm(false);
            }}
            onSubmit={handleSubmitKantin}
            isSubmitting={isSubmitting}
          />

          {kantins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada akun kantin</p>
          ) : (
            <div className="relative overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-sm text-gray-700 bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Nama Kantin
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Deskripsi
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Spreadsheet
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Tanggal Dibuat
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kantins.map((kantin, index) => (
                    <tr
                      key={kantin.id}
                      className={`bg-white border-b border-gray-200 hover:bg-gray-50 ${
                        index === kantins.length - 1 ? '' : 'border-b'
                      }`}
                    >
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {kantin.name}
                      </th>
                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <div className="truncate" title={kantin.description || '-'}>
                          {kantin.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {kantin.email || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {kantin.spreadsheetUrl ? (
                          <a
                            href={kantin.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-unpas-blue hover:underline text-xs max-w-xs block truncate"
                            title={kantin.spreadsheetApiUrl}
                          >
                            {kantin.spreadsheetUrl.length > 40
                              ? `${kantin.spreadsheetUrl.substring(0, 40)}...`
                              : kantin.spreadsheetUrl}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(kantin.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="flex items-center px-6 py-4 gap-3">
                        <button
                          onClick={() => handleEditKantin(kantin)}
                          className="p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <TbEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKantin(kantin.id)}
                          className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

