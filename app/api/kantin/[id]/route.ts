import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kantinId } = await params;

    if (!SUPER_ADMIN_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Super Admin Google Script URL is not configured' },
        { status: 500 }
      );
    }

    // Fetch all kantins from super admin spreadsheet
    const kantins = await fetchKantinsFromGoogleScript(SUPER_ADMIN_SCRIPT_URL);
    
    // Find the specific kantin by ID
    const kantin = kantins.find(k => k.id === kantinId);

    if (!kantin) {
      return NextResponse.json(
        { success: false, error: 'Kantin not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...kantinWithoutPassword } = kantin;

    console.log('Kantin found:', {
      id: kantinWithoutPassword.id,
      name: kantinWithoutPassword.name,
      qrisImage: kantinWithoutPassword.qrisImage,
    });

    return NextResponse.json({
      success: true,
      data: kantinWithoutPassword,
    });
  } catch (error) {
    console.error('Error fetching kantin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch kantin data' 
      },
      { status: 500 }
    );
  }
}

