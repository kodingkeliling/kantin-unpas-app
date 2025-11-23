# E-Kantin UNPAS

Platform pemesanan makanan online untuk kantin Universitas Pasundan (UNPAS).

## Fitur

### Untuk Pengguna
- ✅ **Scan QR Code Lokasi**: Scan QR code di meja dosen atau mahasiswa untuk menentukan lokasi pengiriman pesanan (nama lokasi dan nomor meja)
- ✅ **Daftar Kantin**: Lihat semua kantin yang tersedia di kampus
- ✅ **Menu Kantin**: Setiap kantin memiliki menu sendiri
- ✅ **Keranjang Belanja**: Tambahkan menu ke keranjang dan checkout
- ✅ **Upload Bukti Bayar**: Upload bukti pembayaran saat checkout
- ✅ **Kode Transaksi**: Dapatkan kode transaksi setelah berhasil pesan
- ✅ **Riwayat Transaksi**: 
  - Lihat semua riwayat transaksi dari localStorage
  - Cari transaksi dengan kode transaksi

### Untuk Toko/Admin
- ✅ **Login Toko**: Setiap toko memiliki login sendiri
- ✅ **Dashboard Toko**: Kelola menu kantin
  - Tambah menu baru
  - Edit menu
  - Hapus menu
  - Aktifkan/nonaktifkan menu

## Teknologi

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **LocalStorage** - Penyimpanan data client-side

## Design

Website menggunakan design minimalis dengan:
- Warna dominan putih
- Warna aksen dari logo UNPAS (biru #003366 dan emas #FFB800)
- UI yang clean dan user-friendly

## Cara Menjalankan

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka browser di `http://localhost:3000`

## Struktur Project

```
e-kantin/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Halaman utama
│   ├── kantin/            # Halaman kantin
│   ├── checkout/          # Halaman checkout
│   ├── riwayat/           # Halaman riwayat transaksi
│   └── toko/              # Halaman admin toko
├── components/            # Komponen reusable
├── lib/                   # Utilities dan helpers
│   ├── storage.ts        # LocalStorage utilities
│   ├── auth.ts           # Authentication untuk toko
│   ├── data.ts           # Data mock kantin
│   └── utils.ts          # Utility functions
└── types/                # TypeScript types
```

## Login Toko

Untuk login sebagai admin toko:
- Pilih kantin dari dropdown
- Password default: `admin123`

## Google Drive Integration

Aplikasi menggunakan Google Drive untuk menyimpan bukti pembayaran. User perlu menghubungkan akun Google mereka terlebih dahulu.

Lihat [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) untuk setup lengkap.

## Setup Google Sheets Integration

**📋 Untuk detail lengkap struktur tabel dan field, lihat [SPREADSHEET_STRUCTURE.md](./SPREADSHEET_STRUCTURE.md)**

### Quick Setup

1. **Super Admin Spreadsheet**:
   - Buat sheet "Tokos" dengan field: id, name, description, ownerId, password, spreadsheetUrl, createdAt
   - Deploy Google Apps Script
   - Copy URL ke `.env` sebagai `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`

2. **Spreadsheet Tiap Toko**:
   - Buat sheet "Transactions" dengan field: id, code, kantinId, kantinName, items, total, paymentProof, status, createdAt
   - Deploy Google Apps Script
   - Masukkan URL saat membuat/edit toko di Super Admin Dashboard

## Catatan

- Data disimpan di Google Sheets sebagai primary storage
- Data juga disimpan di localStorage sebagai backup/fallback
- User harus memilih toko terlebih dahulu untuk melihat riwayat transaksi
- Setiap toko memiliki spreadsheet sendiri untuk menyimpan data transaksinya

## Build untuk Production

```bash
npm run build
npm start
```
