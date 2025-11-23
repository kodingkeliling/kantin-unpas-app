import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { KantinAccount, getDayNumber } from '@/lib/kantin';

const SUPER_ADMIN_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';

async function fetchKantinsFromGoogleScript(scriptUrl: string): Promise<KantinAccount[]> {
  try {
    const url = `${scriptUrl}?sheet=${encodeURIComponent('AkunKantin')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    // Check if response is HTML (redirect page)
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data && Array.isArray(result.data)) {
      // Parse operatingHours from JSON string to array if needed
      return result.data.map((kantin: any) => {
        let operatingHours = kantin.operatingHours;
        if (typeof operatingHours === 'string') {
          try {
            operatingHours = JSON.parse(operatingHours);
          } catch {
            operatingHours = [];
          }
        }
        // Convert day from string to number if needed
        if (Array.isArray(operatingHours)) {
          operatingHours = operatingHours.map((h: any) => ({
            ...h,
            day: typeof h.day === 'string' ? getDayNumber(h.day) : h.day,
          }));
        }
        return {
          ...kantin,
          operatingHours,
        };
      }) as KantinAccount[];
    }

    throw new Error('Invalid response format from Google Script');
  } catch (error) {
    console.error('Error fetching from Google Script:', error);
    throw error;
  }
}

async function fetchTransactionFromSheet(scriptUrl: string, transactionId: string) {
  try {
    const url = `${scriptUrl}?sheet=${encodeURIComponent('Pesanan')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data && Array.isArray(result.data)) {
      const transaction = result.data.find((t: any) => t.id === transactionId);
      return transaction || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

async function updateTransactionStatusInSheet(scriptUrl: string, transactionId: string, status: string) {
  try {
    const url = `${scriptUrl}?sheet=${encodeURIComponent('Pesanan')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        id: transactionId,
        data: {
          status,
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
}

async function fetchMenusFromSheet(scriptUrl: string) {
  try {
    const url = `${scriptUrl}?sheet=${encodeURIComponent('Menus')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
}

async function updateMenuQuantityInSheet(scriptUrl: string, menuId: string, newQuantity: number) {
  try {
    const url = `${scriptUrl}?sheet=${encodeURIComponent('Menus')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        id: menuId,
        data: {
          quantity: newQuantity,
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error updating menu quantity:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, status } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID diperlukan' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'processing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Get kantin data from super admin spreadsheet
    const scriptUrl = SUPER_ADMIN_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    let allKantins: KantinAccount[];
    try {
      allKantins = await fetchKantinsFromGoogleScript(scriptUrl);
    } catch (error) {
      console.error('Error fetching kantins:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Gagal mengambil data kantin.' 
        },
        { status: 500 }
      );
    }

    const kantin = allKantins.find((k: any) => k.id === payload.kantinId);

    if (!kantin) {
      return NextResponse.json(
        { success: false, error: 'Kantin tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!kantin.spreadsheetApiUrl) {
      return NextResponse.json(
        { success: false, error: 'Spreadsheet API URL tidak ditemukan untuk kantin ini' },
        { status: 500 }
      );
    }

    // Fetch transaction to get items
    let transaction;
    try {
      transaction = await fetchTransactionFromSheet(kantin.spreadsheetApiUrl, transactionId);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Gagal mengambil data transaksi.' 
        },
        { status: 500 }
      );
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify transaction belongs to this kantin
    if (transaction.kantinId !== kantin.id) {
      return NextResponse.json(
        { success: false, error: 'Transaksi tidak milik kantin ini' },
        { status: 403 }
      );
    }

    // Update transaction status
    try {
      await updateTransactionStatusInSheet(kantin.spreadsheetApiUrl, transactionId, status);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Gagal mengupdate status transaksi.' 
        },
        { status: 500 }
      );
    }

    // If status is 'processing' or 'ready', reduce menu quantities
    // Only reduce if status is changing from 'pending' to 'processing' or 'ready'
    // This ensures stock is only reduced once when order is first processed
    if ((status === 'processing' || status === 'ready') && transaction.status === 'pending') {
      try {
        // Parse items from transaction
        let items: Array<{ menuId: string; quantity: number }> = [];
        if (typeof transaction.items === 'string') {
          try {
            items = JSON.parse(transaction.items);
          } catch {
            console.error('Error parsing items:', transaction.items);
          }
        } else if (Array.isArray(transaction.items)) {
          items = transaction.items;
        }

        // Fetch all menus
        const menus = await fetchMenusFromSheet(kantin.spreadsheetApiUrl);

        // Update quantity for each item
        for (const item of items) {
          const menu = menus.find((m: any) => m.id === item.menuId);
          if (menu && menu.quantity !== undefined) {
            const currentQuantity = typeof menu.quantity === 'string' 
              ? parseInt(menu.quantity) 
              : (menu.quantity || 0);
            
            const orderedQuantity = typeof item.quantity === 'string'
              ? parseInt(item.quantity)
              : (item.quantity || 0);

            const newQuantity = Math.max(0, currentQuantity - orderedQuantity);

            // Update menu quantity in spreadsheet
            await updateMenuQuantityInSheet(kantin.spreadsheetApiUrl, item.menuId, newQuantity);
          }
        }
      } catch (error) {
        console.error('Error updating menu quantities:', error);
        // Don't fail the entire request if menu update fails, but log it
        // Status update already succeeded, so we continue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status transaksi berhasil diupdate',
    });
  } catch (error) {
    console.error('Error in update-transaction-status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate status transaksi' 
      },
      { status: 500 }
    );
  }
}

