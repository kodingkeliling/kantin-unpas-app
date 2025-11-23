# Setup Google Drive untuk E-Kantin UNPAS

## Overview

Aplikasi ini menggunakan Google Drive untuk menyimpan bukti pembayaran. User perlu menghubungkan akun Google mereka untuk bisa mengupload gambar.

## 1. Setup Google OAuth Credentials

### Langkah 1: Buat OAuth 2.0 Client ID

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih atau buat project baru
3. Aktifkan **Google Drive API**:
   - Pergi ke **APIs & Services** > **Library**
   - Cari "Google Drive API"
   - Klik **Enable**

4. Buat OAuth 2.0 Credentials:
   - Pergi ke **APIs & Services** > **Credentials**
   - Klik **Create Credentials** > **OAuth client ID**
   - Pilih **Web application**
   - Isi **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback` (untuk development)
     - `https://yourdomain.com/auth/google/callback` (untuk production)
   - Klik **Create**
   - Copy **Client ID** dan **Client Secret**

### Langkah 2: Setup Environment Variables

Tambahkan ke file `.env`:

```env
NEXT_PUBLIC_OAUTH_REDIRECT_URL=http://localhost:3000/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret
```

## 2. Cara Kerja

### Flow Upload Gambar

1. **User Connect Google Drive**:
   - User klik tombol "Hubungkan ke Google Drive"
   - Popup OAuth Google muncul
   - User login dan authorize aplikasi
   - Access token disimpan di localStorage dan cookies

2. **Upload Bukti Pembayaran**:
   - User pilih file gambar
   - User klik "Konfirmasi Pesanan"
   - File diupload ke Google Drive via API
   - File dibuat public (anyone can view)
   - URL file disimpan di transaksi

### API Routes

- `/api/auth/google/token` - Exchange authorization code untuk access token
- `/api/auth/google/store-tokens` - Simpan tokens di cookies
- `/api/auth/google/status` - Cek status autentikasi
- `/api/auth/google/logout` - Logout dan hapus tokens
- `/api/upload` - Upload file ke Google Drive

## 3. Fitur

- ✅ OAuth 2.0 dengan popup window
- ✅ Access token disimpan di localStorage dan cookies
- ✅ File diupload langsung ke Google Drive
- ✅ File otomatis dibuat public untuk bisa diakses
- ✅ Validasi file (max 5MB, hanya gambar)
- ✅ Preview gambar sebelum upload
- ✅ Loading state saat upload
- ✅ Error handling yang baik

## 4. Troubleshooting

### Popup diblokir
- Pastikan browser mengizinkan popup untuk domain ini
- Coba di browser lain atau incognito mode

### "Authentication required"
- Pastikan user sudah connect Google Drive
- Cek apakah access token masih valid
- Coba disconnect dan connect lagi

### Upload gagal
- Cek apakah Google Drive API sudah diaktifkan
- Pastikan OAuth credentials sudah benar
- Cek console browser untuk error detail

### File tidak bisa diakses
- Pastikan permission file sudah di-set ke "anyone can view"
- Cek apakah file ID sudah benar

## 5. Security Notes

- Access token disimpan di localStorage (client-side)
- Token juga disimpan di httpOnly cookies untuk server-side access
- Token memiliki expiry time
- Scope yang digunakan: `https://www.googleapis.com/auth/drive.file` (hanya untuk file yang dibuat oleh aplikasi)

