import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables
    const superAdminUsername = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
    const superAdminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

    if (!superAdminUsername || !superAdminPassword) {
      console.error('Super Admin credentials not configured in .env');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi super admin belum diatur' },
        { status: 500 }
      );
    }

    // Validate credentials
    if (username === superAdminUsername && password === superAdminPassword) {
      return NextResponse.json({
        success: true,
        data: {
          role: 'superadmin',
          username: superAdminUsername,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Super Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}

