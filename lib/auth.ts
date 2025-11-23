const AUTH_KEY = 'ekantin_auth';
const KANTIN_KEY = 'ekantin_kantin';
const SUPER_ADMIN_KEY = 'ekantin_superadmin';

export interface KantinAuth {
  kantinId: string;
  kantinName: string;
  ownerId: string;
  role: 'kantin';
}

export interface SuperAdminAuth {
  role: 'superadmin';
  username: string;
}

export type Auth = KantinAuth | SuperAdminAuth;

export const auth = {
  loginKantin: (kantinAuth: KantinAuth): void => {
    if (typeof window === 'undefined') return;
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
    return auth.getAuth() !== null;
  },
  isSuperAdmin: (): boolean => {
    const authData = auth.getAuth();
    return authData?.role === 'superadmin';
  },
  isKantin: (): boolean => {
    const authData = auth.getAuth();
    return authData?.role === 'kantin';
  },
};

