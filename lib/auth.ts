const TOKEN_KEY = 'ekantin_token';
const AUTH_KEY = 'ekantin_auth';
const KANTIN_KEY = 'ekantin_kantin';
const SUPER_ADMIN_KEY = 'ekantin_superadmin';

export interface KantinAuth {
  kantinId: string;
  kantinName: string;
  ownerId: string;
  role: 'kantin';
  [key: string]: any; // Allow additional fields from API
}

export interface SuperAdminAuth {
  role: 'superadmin';
  username: string;
}

export type Auth = KantinAuth | SuperAdminAuth;

export const auth = {
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  loginKantin: (kantinAuth: KantinAuth, token: string): void => {
    if (typeof window === 'undefined') return;
    auth.setToken(token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(kantinAuth));
    localStorage.setItem(KANTIN_KEY, JSON.stringify(kantinAuth));
  },
  loginSuperAdmin: (superAdminAuth: SuperAdminAuth): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEY, JSON.stringify(superAdminAuth));
    localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(superAdminAuth));
  },
  logout: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(KANTIN_KEY);
    localStorage.removeItem(SUPER_ADMIN_KEY);
  },
  getAuth: (): Auth | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },
  isAuthenticated: (): boolean => {
    return auth.getToken() !== null;
  },
  isSuperAdmin: (): boolean => {
    const authData = auth.getAuth();
    return authData?.role === 'superadmin';
  },
  isKantin: (): boolean => {
    const authData = auth.getAuth();
    return authData?.role === 'kantin';
  },
  // Check authentication via /me endpoint
  checkAuth: async (): Promise<Auth | null> => {
    if (typeof window === 'undefined') return null;
    
    const token = auth.getToken();
    if (!token) {
      auth.logout();
      return null;
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        auth.logout();
        return null;
      }

      // Update auth data with fresh data from API
      const kantinAuth: KantinAuth = {
        kantinId: result.data.id,
        kantinName: result.data.name,
        ownerId: result.data.ownerId,
        role: 'kantin',
        ...result.data, // Include all other fields from API
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(kantinAuth));
      localStorage.setItem(KANTIN_KEY, JSON.stringify(kantinAuth));

      return kantinAuth;
    } catch (error) {
      console.error('Auth check error:', error);
      auth.logout();
      return null;
    }
  },
};

