import { NextRequest, NextResponse } from 'next/server';
import { KantinAccount, getDayNumber } from '@/lib/kantin';
import { signToken } from '@/lib/jwt';

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
      throw new Error('Google Script returned HTML instead of JSON. Please check the script deployment settings.');
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Get data from Google Script API (server-side, hidden from browser)
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';
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
          error: error instanceof Error ? error.message : 'Gagal mengambil data kantin. Silakan coba lagi.' 
        },
        { status: 500 }
      );
    }

    const kantin = allKantins.find((k) => k.email?.toLowerCase() === email.toLowerCase());

    if (!kantin) {
      return NextResponse.json(
        { success: false, error: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }

    if (password !== kantin.password) {
      return NextResponse.json(
        { success: false, error: 'Password salah' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      kantinId: kantin.id,
      email: kantin.email || '',
      role: 'kantin',
    });

    // Return kantin data (without password) and token
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
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat login. Silakan coba lagi.' 
      },
      { status: 500 }
    );
  }
}

