# Setup Google Sheets untuk E-Kantin UNPAS

## Overview

Aplikasi ini menggunakan Google Sheets sebagai database untuk menyimpan data. Ada 2 level spreadsheet:

1. **Super Admin Spreadsheet**: Menyimpan daftar toko/kantin dan URL spreadsheet masing-masing toko
2. **Toko Spreadsheet**: Setiap toko memiliki spreadsheet sendiri untuk menyimpan data transaksi

**📋 Untuk detail struktur tabel dan field, lihat [SPREADSHEET_STRUCTURE.md](./SPREADSHEET_STRUCTURE.md)**

## 1. Setup Super Admin Spreadsheet

### Langkah 1: Buat Google Spreadsheet

1. Buat Google Spreadsheet baru dengan nama "E-Kantin Super Admin"
2. Buat sheet dengan nama "Tokos"
3. Tambahkan header di baris pertama:
   - id
   - name
   - description
   - ownerId
   - password
   - spreadsheetUrl
   - createdAt

### Langkah 2: Buat Google Apps Script

1. Di Google Spreadsheet, klik **Extensions** > **Apps Script**
2. Ganti kode dengan script berikut:

```javascript
function doGet(e) {
  const sheetName = e.parameter.sheet || 'Tokos';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: result
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheetName = e.parameter.sheet || 'Tokos';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action || 'create';
  const data = postData.data;
  
  if (action === 'create') {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => data[header] || '');
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'update') {
    // Implementation for update if needed
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Update not implemented yet'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

3. Simpan script (Ctrl+S atau Cmd+S)
4. Deploy script:
   - Klik **Deploy** > **New deployment**
   - Pilih type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - Copy URL yang diberikan

### Langkah 3: Setup Environment Variable

1. Copy file `.env.example` menjadi `.env`
2. Paste URL Google Apps Script ke `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`

## 2. Setup Spreadsheet untuk Setiap Toko

### Langkah 1: Buat Google Spreadsheet untuk Toko

1. Buat Google Spreadsheet baru untuk setiap toko (contoh: "Kantin Utama - Transactions")
2. Buat sheet dengan nama "Transactions"
3. Tambahkan header di baris pertama:
   - id
   - code
   - kantinId
   - kantinName
   - items
   - total
   - paymentProof
   - status
   - createdAt

### Langkah 2: Buat Google Apps Script untuk Toko

1. Di Google Spreadsheet toko, klik **Extensions** > **Apps Script**
2. Gunakan script yang sama seperti Super Admin (copy dari langkah 2 di atas)
3. Deploy script dan copy URL

### Langkah 3: Input URL ke Super Admin Dashboard

1. Login sebagai Super Admin
2. Buat atau Edit akun toko
3. Masukkan URL Google Apps Script toko di field "URL Spreadsheet API"
4. Simpan

## 3. Format Data

### Sheet "Tokos" (Super Admin)

| id | name | description | ownerId | password | spreadsheetUrl | createdAt |
|----|------|-------------|---------|----------|----------------|-----------|
| toko-1 | Kantin Utama | ... | owner-1 | admin123 | https://... | 2024-01-01 |

### Sheet "Transactions" (Toko)

| id | code | kantinId | kantinName | items | total | paymentProof | status | createdAt |
|----|------|----------|------------|-------|-------|--------------|--------|-----------|
| txn-1 | EK-XXX | toko-1 | Kantin Utama | [{"menuId":"...","menuName":"...","quantity":2,"price":15000}] | 30000 | https://... | pending | 2024-01-01 |

**Note:** Field `items` disimpan sebagai JSON string di Google Sheets.

## 4. Testing

1. Pastikan Super Admin Spreadsheet sudah di-setup dan URL sudah di-set di `.env`
2. Buat akun toko baru di Super Admin Dashboard dengan spreadsheet URL
3. Buat transaksi dari aplikasi
4. Cek apakah data tersimpan di spreadsheet toko
5. Cek riwayat transaksi dengan memilih toko yang sesuai

## Troubleshooting

- **Error "Google Script URL is not configured"**: Pastikan `.env` sudah di-set dengan benar
- **Data tidak tersimpan**: Cek apakah Google Apps Script sudah di-deploy dengan akses "Anyone"
- **Data tidak muncul di riwayat**: Pastikan sudah memilih toko yang benar dan spreadsheet URL sudah di-set

