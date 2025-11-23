import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify token is still valid by checking with Google
    const verifyResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
    
    if (!verifyResponse.ok) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}

