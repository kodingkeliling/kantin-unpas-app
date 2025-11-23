import { NextRequest, NextResponse } from 'next/server';

const SUPER_ADMIN_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sheet = searchParams.get('sheet') || 'AkunKantin';
    const scriptUrl = searchParams.get('scriptUrl') || SUPER_ADMIN_SCRIPT_URL;
    
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL is not configured' },
        { status: 500 }
      );
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const url = `${scriptUrl}?sheet=${sheet}&t=${timestamp}&r=${randomId}&_cb=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    
    // Check if response is HTML (redirect page)
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      return NextResponse.json(
        { success: false, error: 'Google Script returned HTML instead of JSON' },
        { status: 500 }
      );
    }

    const result = JSON.parse(text);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('Google Script API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sheet = searchParams.get('sheet') || 'AkunKantin';
    const scriptUrl = searchParams.get('scriptUrl') || SUPER_ADMIN_SCRIPT_URL;
    const body = await request.json();
    
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL is not configured' },
        { status: 500 }
      );
    }

    // Email should already be in data object from the frontend
    // No need to add from env variable
    const payloadWithEmail = { ...body };

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const url = `${scriptUrl}?sheet=${sheet}&t=${timestamp}&r=${randomId}&_cb=${Date.now()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadWithEmail),
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: `HTTP ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText.substring(0, 100) : ''}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    
    // Check if response is HTML (redirect page)
    if (text.trim().startsWith('<') || text.includes('<HTML>') || text.includes('<!DOCTYPE')) {
      return NextResponse.json(
        { success: false, error: 'Google Script returned HTML instead of JSON' },
        { status: 500 }
      );
    }

    const result = JSON.parse(text);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('Google Script API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

