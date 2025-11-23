# Struktur Google Sheets untuk E-Kantin UNPAS

## 1. Super Admin Spreadsheet (Level ENV)

Spreadsheet ini disimpan di environment variable `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`.

### Sheet: "Kantins"

Sheet ini menyimpan daftar semua kantin dan URL spreadsheet masing-masing.

| Field | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| id | String | ID unik toko | `toko-1` |
| name | String | Nama toko/kantin | `Kantin Utama` |
| description | String | Deskripsi toko (opsional) | `Kantin utama dengan berbagai menu lengkap` |
| ownerId | String | ID pemilik toko | `owner-1` |
| password | String | Password untuk login toko | `admin123` |
| spreadsheetUrl | String | URL Google Apps Script untuk spreadsheet toko ini | `https://script.google.com/macros/s/.../exec` |
| createdAt | String | Tanggal dibuat (ISO format) | `2024-01-15T10:30:00.000Z` |

**Contoh Data:**
```
id: kantin-1
name: Kantin Utama
description: Kantin utama dengan berbagai menu lengkap
ownerId: owner-1
password: admin123
spreadsheetUrl: https://script.google.com/macros/s/AKfycbz.../exec
createdAt: 2024-01-15T10:30:00.000Z
```

---

## 2. Spreadsheet Tiap Toko/Kantin

Setiap toko memiliki spreadsheet sendiri dengan URL yang disimpan di Super Admin Spreadsheet.

### Sheet: "Pesanan"

Sheet ini menyimpan semua transaksi/pesanan untuk toko tersebut.

| Field | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| id | String | ID unik transaksi | `txn-1705312200000` |
| code | String | Kode transaksi (untuk user) | `EK-ABC123-XYZ` |
| kantinId | String | ID toko/kantin | `toko-1` |
| kantinName | String | Nama toko/kantin | `Kantin Utama` |
| items | JSON String | Array items dalam format JSON | `[{"menuId":"menu-1","menuName":"Nasi Goreng","quantity":2,"price":15000}]` |
| total | Number | Total harga transaksi | `30000` |
| paymentProof | String | URL bukti pembayaran (Google Drive) | `https://drive.google.com/uc?id=...` |
| deliveryLocation | JSON String | Lokasi pengiriman (opsional) | `{"name":"Gedung A","tableNumber":"Meja 1","scannedAt":"2024-01-15T10:30:00.000Z"}` |
| status | String | Status transaksi | `pending`, `processing`, `ready`, `completed`, `cancelled` |
| createdAt | String | Tanggal transaksi (ISO format) | `2024-01-15T10:30:00.000Z` |

**Format Items (JSON):**
```json
[
  {
    "menuId": "menu-1",
    "menuName": "Nasi Goreng Spesial",
    "quantity": 2,
    "price": 15000
  },
  {
    "menuId": "menu-2",
    "menuName": "Mie Ayam",
    "quantity": 1,
    "price": 12000
  }
]
```

**Contoh Data:**
```
id: txn-1705312200000
code: EK-ABC123-XYZ
kantinId: kantin-1
kantinName: Kantin Utama
items: [{"menuId":"menu-1","menuName":"Nasi Goreng","quantity":2,"price":15000}]
total: 30000
paymentProof: https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j
deliveryLocation: {"name":"Gedung A","tableNumber":"Meja 1","scannedAt":"2024-01-15T10:30:00.000Z"}
status: pending
createdAt: 2024-01-15T10:30:00.000Z
```

**Status Transaksi:**
- `pending` - Menunggu konfirmasi
- `processing` - Sedang diproses
- `ready` - Siap diambil
- `completed` - Selesai
- `cancelled` - Dibatalkan

---

## 3. Google Apps Script untuk Super Admin Spreadsheet

Script ini harus bisa:
- **GET** `/api?sheet=Kantins` - Mengambil semua data kantin
- **POST** `/api?sheet=Kantins` - Menambah/update data kantin

**Format Request POST:**
```json
{
  "action": "create" | "update",
  "id": "kantin-1", // untuk update
  "data": {
    "id": "kantin-1",
    "name": "Kantin Utama",
    "description": "...",
    "ownerId": "owner-1",
    "password": "admin123",
    "spreadsheetUrl": "https://...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Format Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "kantin-1",
      "name": "Kantin Utama",
      ...
    }
  ]
}
```

---

## 4. Google Apps Script untuk Spreadsheet Tiap Toko

Script ini harus bisa:
- **GET** `/api?sheet=Pesanan` - Mengambil semua transaksi
- **POST** `/api?sheet=Pesanan` - Menambah transaksi baru

**Format Request POST:**
```json
{
  "action": "create",
  "data": {
    "id": "txn-1705312200000",
    "code": "EK-ABC123-XYZ",
    "kantinId": "toko-1",
    "kantinName": "Kantin Utama",
    "items": "[{\"menuId\":\"menu-1\",\"menuName\":\"Nasi Goreng\",\"quantity\":2,\"price\":15000}]",
    "total": 30000,
    "paymentProof": "https://drive.google.com/uc?id=...",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Format Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn-1705312200000",
      "code": "EK-ABC123-XYZ",
      ...
    }
  ]
}
```

---

## 5. Template Google Apps Script

### Untuk Super Admin Spreadsheet (Sheet: Kantins)

```javascript
function doGet(e) {
  const sheetName = e.parameter.sheet || 'Kantins';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
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
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    const idColumnIndex = headers.indexOf('id');
    
    if (idColumnIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'ID column not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const rowIndex = values.findIndex((row, index) => index > 0 && row[idColumnIndex] === postData.id);
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Record not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    headers.forEach((header, colIndex) => {
      if (data[header] !== undefined) {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(data[header]);
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data updated successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Untuk Spreadsheet Tiap Toko (Sheet: Pesanan)

Gunakan script yang sama seperti di atas, hanya ganti sheet name menjadi "Pesanan".

---

## 6. Setup Checklist

### Super Admin Spreadsheet:
- [ ] Buat Google Spreadsheet baru
- [ ] Buat sheet dengan nama "Kantins"
- [ ] Tambahkan header: id, name, description, ownerId, password, spreadsheetUrl, createdAt
- [ ] Buat Google Apps Script dengan template di atas
- [ ] Deploy sebagai Web App (Anyone can access)
- [ ] Copy URL ke `.env` sebagai `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`

### Spreadsheet Tiap Kantin:
- [ ] Buat Google Spreadsheet baru untuk setiap toko
- [ ] Buat sheet dengan nama "Pesanan"
- [ ] Tambahkan header: id, code, kantinId, kantinName, items, total, paymentProof, deliveryLocation, status, createdAt
- [ ] Buat Google Apps Script dengan template di atas
- [ ] Deploy sebagai Web App (Anyone can access)
- [ ] Copy URL ke Super Admin Dashboard saat membuat/edit toko

---

## 7. Catatan Penting

1. **Field `items`** disimpan sebagai JSON string di Google Sheets, bukan sebagai object
2. **Field `paymentProof`** berisi URL Google Drive yang sudah diupload
3. **Status transaksi** menggunakan enum: pending, processing, ready, completed, cancelled
4. **Semua tanggal** menggunakan format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
5. **ID** harus unique untuk setiap record
6. **Password** disimpan sebagai plain text (untuk production, sebaiknya di-hash)

---

## 8. Contoh Data Lengkap

### Super Admin - Sheet "Kantins"
```
Row 1 (Header):
id | name | description | ownerId | password | spreadsheetUrl | createdAt

Row 2 (Data):
kantin-1 | Kantin Utama | Kantin utama dengan berbagai menu lengkap | owner-1 | admin123 | https://script.google.com/macros/s/ABC123/exec | 2024-01-15T10:30:00.000Z

Row 3 (Data):
kantin-2 | Kantin Barat | Menu barat dan minuman | owner-2 | admin123 | https://script.google.com/macros/s/DEF456/exec | 2024-01-15T11:00:00.000Z
```

### Kantin - Sheet "Pesanan"
```
Row 1 (Header):
id | code | kantinId | kantinName | items | total | paymentProof | status | createdAt

Row 2 (Data):
txn-1705312200000 | EK-ABC123-XYZ | kantin-1 | Kantin Utama | [{"menuId":"menu-1","menuName":"Nasi Goreng","quantity":2,"price":15000}] | 30000 | https://drive.google.com/uc?id=1a2b3c | pending | 2024-01-15T10:30:00.000Z

Row 3 (Data):
txn-1705312300000 | EK-DEF456-UVW | kantin-1 | Kantin Utama | [{"menuId":"menu-2","menuName":"Mie Ayam","quantity":1,"price":12000}] | 12000 | https://drive.google.com/uc?id=2b3c4d | processing | 2024-01-15T11:00:00.000Z
```

