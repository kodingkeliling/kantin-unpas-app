export const GOOGLE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  scope: 'https://www.googleapis.com/auth/drive.file',
};

export const getRedirectUrl = () => {
  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL || 'http://localhost:3000/auth/google/callback';
};

export const initiateGoogleAuth = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const redirectUrl = getRedirectUrl();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    const popup = window.open(
      authUrl,
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        checkAuthStatus().then((authenticated) => {
          if (authenticated) {
            resolve(true);
          } else {
            reject(new Error('Authentication failed or was cancelled'));
          }
        }).catch(reject);
      }
    }, 1000);

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
        resolve(true);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
        reject(new Error(event.data.error || 'Authentication failed'));
      }
    };

    window.addEventListener('message', messageListener);
  });
};

export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/google/status');
    if (response.ok) {
      const data = await response.json();
      return data.authenticated;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('google_access_token');
};

export const disconnectGoogle = async () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_refresh_token');
  localStorage.removeItem('google_token_expiry');
  await fetch('/api/auth/google/logout', { method: 'POST' });
};

