# Google Apps Script - Kode yang Diperbaiki

Berikut adalah kode Google Apps Script yang sudah diperbaiki untuk mengatasi error:

## Masalah yang Diperbaiki:

1. ❌ `const newAccount = JSON.stringify(data);` - Membuat string, bukan object
2. ❌ `const emailTo = newAccount?.email` - Tidak bisa akses email dari string
3. ❌ `createdDate` tidak didefinisikan - Akan menyebabkan ReferenceError
4. ❌ Email dikirim tanpa try-catch yang proper

## Kode yang Diperbaiki:

```javascript
function handleCreate(data, sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : [];

  const keys = Object.keys(data);
  const newHeaders = [...headers];

  keys.forEach(key => {
    if (!newHeaders.includes(key)) {
      newHeaders.push(key);
    }
  });

  if (newHeaders.length > headers.length) {
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
  }

  const newRow = newHeaders.map(header => data[header] || '');
  sheet.appendRow(newRow);

  // Kirim notifikasi email onboarding
  if (data.email) {
    try {
      // Format tanggal yang lebih rapi
      let createdDate = '-';
      if (data.createdAt) {
        try {
          const dateObj = new Date(data.createdAt);
          createdDate = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (dateError) {
          // Fallback ke format ISO jika parsing gagal
          createdDate = data.createdAt;
        }
      }

      const emailBody = `
═══════════════════════════════════════════
   SELAMAT DATANG DI KELUARGA E-KANTIN UNPAS
═══════════════════════════════════════════

Halo ${data.name || 'Kantin'}! 🎉

Selamat! Akun kantin Anda telah berhasil dibuat dan siap digunakan.

📋 INFORMASI AKUN ANDA
───────────────────────────────────────────
Nama Kantin    : ${data.name || '-'}
${data.description ? 'Deskripsi      : ' + data.description + '\n' : ''}ID Kantin       : ${data.id || '-'}
Tanggal Dibuat : ${createdDate}

🔐 INFORMASI LOGIN
───────────────────────────────────────────
Password       : ${data.password || '-'}

⚠️  PENTING: Simpan informasi login ini dengan aman!
   Jangan bagikan password Anda kepada pihak lain.

📊 SPREADSHEET ANDA
───────────────────────────────────────────
URL Spreadsheet: ${data.spreadsheetUrl || '-'}

   Spreadsheet ini akan digunakan untuk menyimpan 
   data transaksi dan riwayat pesanan dari kantin Anda.

📝 LANGKAH SELANJUTNYA
───────────────────────────────────────────
1. Login ke dashboard kantin Anda menggunakan 
   password di atas
   
2. Tambahkan menu-menu yang akan dijual di kantin Anda
   
3. Pastikan semua informasi menu sudah lengkap 
   (nama, harga, deskripsi, dan gambar)
   
4. Mulai terima pesanan dari pelanggan!

💡 TIPS
───────────────────────────────────────────
• Update menu secara berkala untuk menarik pelanggan
• Pastikan harga menu sudah sesuai
• Upload gambar menu yang menarik
• Pantau transaksi melalui dashboard

───────────────────────────────────────────

Jika Anda memiliki pertanyaan atau membutuhkan 
bantuan, jangan ragu untuk menghubungi tim support.

Selamat bergabung dan semoga sukses! 🎊

───────────────────────────────────────────
E-Kantin UNPAS
Sistem Manajemen Kantin Digital
Universitas Pasundan
───────────────────────────────────────────
      `.trim();

      MailApp.sendEmail({
        to: data.email,
        subject: "Selamat Datang di Keluarga E-Kantin UNPAS 🎉",
        body: emailBody
      });
    } catch (emailError) {
      // Log error but don't fail the entire operation
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Perubahan yang Dilakukan:

1. ✅ **Hapus `JSON.stringify(data)`** - Langsung gunakan `data.email`
2. ✅ **Definisikan `createdDate`** - Dengan error handling untuk parsing tanggal
3. ✅ **Tambahkan try-catch** - Untuk menangani error email tanpa menghentikan proses
4. ✅ **Gunakan `data.email` langsung** - Tidak perlu stringify dulu

## Cara Menggunakan:

1. Copy fungsi `handleCreate` yang sudah diperbaiki di atas
2. Paste ke Google Apps Script Anda
3. Ganti fungsi `handleCreate` yang lama
4. Test dengan membuat akun kantin baru

