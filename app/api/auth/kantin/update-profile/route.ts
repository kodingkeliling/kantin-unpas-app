import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getDayNumber } from '@/lib/kantin';

async function fetchKantinsFromGoogleScript(scriptUrl: string) {
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

    throw new Error('Invalid response format from Google Script');
  } catch (error) {
    console.error('Error fetching from Google Script:', error);
    throw error;
  }
}

async function updateKantinInSuperAdminSheet(kantinId: string, updatedData: any) {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';
  if (!scriptUrl) {
    throw new Error('Google Script URL tidak dikonfigurasi');
  }

  const url = `${scriptUrl}?sheet=${encodeURIComponent('AkunKantin')}&t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      id: kantinId,
      data: updatedData,
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
    const { name, description, whatsapp, coverImage, operatingHours } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nama kantin harus diisi' },
        { status: 400 }
      );
    }

    // Get fresh data from Google Script
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    let allKantins;
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

    // Update profile (keep email and password unchanged)
    // Convert operatingHours array to JSON string for Google Sheets storage
    const updatedKantin = {
      ...kantin,
      name,
      description: description || '',
      whatsapp: whatsapp || '',
      coverImage: coverImage || '',
      operatingHours: Array.isArray(operatingHours) ? JSON.stringify(operatingHours) : (operatingHours || '[]'),
    };

    // Update to Google Sheets
    try {
      await updateKantinInSuperAdminSheet(payload.kantinId, updatedKantin);
    } catch (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Gagal mengupdate profile.' 
        },
        { status: 500 }
      );
    }

    // Return updated data (without password)
    // Parse operatingHours back from JSON string to array, and convert day from string to number
    const { password: _, ...kantinWithoutPassword } = updatedKantin;
    let parsedOperatingHours = [];
    
    if (typeof kantinWithoutPassword.operatingHours === 'string') {
      try {
        parsedOperatingHours = JSON.parse(kantinWithoutPassword.operatingHours);
      } catch {
        parsedOperatingHours = [];
      }
    } else {
      parsedOperatingHours = kantinWithoutPassword.operatingHours || [];
    }
    
    // Convert day from string to number if needed (backward compatibility)
    const convertedOperatingHours = parsedOperatingHours.map((h: any) => ({
      ...h,
      day: typeof h.day === 'string' ? getDayNumber(h.day) : (typeof h.day === 'number' ? h.day : 1),
    }));
    
    const parsedData = {
      ...kantinWithoutPassword,
      operatingHours: convertedOperatingHours,
    };
    
    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.' 
      },
      { status: 500 }
    );
  }
}

