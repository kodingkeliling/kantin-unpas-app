import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { KantinAccount, getDayNumber } from '@/lib/kantin';

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
    
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      throw new Error('Google Script returned HTML instead of JSON.');
    }

    const result = JSON.parse(text);
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data && Array.isArray(result.data)) {
      return result.data as KantinAccount[];
    }

    throw new Error('Invalid response format from Google Script');
  } catch (error) {
    console.error('Error fetching from Google Script:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
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

    // Return kantin data (without password)
    // Parse operatingHours from JSON string to array if needed, and convert day from string to number
    const { password: _, ...kantinWithoutPassword } = kantin;
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
    
    // Debug: Log to ensure spreadsheetApiUrl is included
    console.log('Kantin data from /me endpoint:', {
      id: parsedData.id,
      name: parsedData.name,
      spreadsheetApiUrl: parsedData.spreadsheetApiUrl,
    });
    
    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.' 
      },
      { status: 500 }
    );
  }
}

