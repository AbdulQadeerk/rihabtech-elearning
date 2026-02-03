import { API_BASE_URL } from './api';
import { toast } from 'sonner';

// Google login endpoint
const GOOGLE_LOGIN_ENDPOINT = `${API_BASE_URL}auth/google/login`;

// Google OAuth Configuration
// Note: Environment variables are loaded at build time, so the dev server must be restarted
// after adding/modifying .env file
const resolveEnvClientId = () => {
  // CRA style
  const fromProcess = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  // Vite style (guard to avoid TS errors if import.meta is not present)
  const fromImportMeta =
    typeof import.meta !== 'undefined' &&
    (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID;
  return fromProcess || fromImportMeta || '';
};

export const GOOGLE_CONFIG = {
  clientId: resolveEnvClientId(),
  // Redirect URI - Google OAuth works better with path-based routing
  // We'll handle hash routing manually after OAuth callback
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/login' : '',
  scope: "openid profile email",
};

// Debug: Log client ID status (remove in production)
if (typeof window !== 'undefined') {
  const processEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID : undefined;
  console.log('Google Client ID loaded:', !!GOOGLE_CONFIG.clientId,
    GOOGLE_CONFIG.clientId ? `${GOOGLE_CONFIG.clientId.substring(0, 20)}...` : 'NOT SET');
  console.log('Debug - process.env.REACT_APP_GOOGLE_CLIENT_ID:', processEnv || 'undefined');
  console.log('Debug - import.meta.env.VITE_GOOGLE_CLIENT_ID:', importMetaEnv || 'undefined');
  console.log('Debug - resolved value:', GOOGLE_CONFIG.clientId || 'empty string');
}

// Google OAuth Helper Functions
export const GoogleAuth = {
  // Initialize Google OAuth
  init: async () => {
    // Try to fetch Client ID from backend
    try {
      const response = await fetch(`${API_BASE_URL}auth/google/client-id`);
      if (response.ok) {
        const data = await response.json();
        if (data.clientId) {
          console.log('✅ Fetched Google Client ID from backend:', data.clientId.substring(0, 10) + '...');
          GOOGLE_CONFIG.clientId = data.clientId;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Google Client ID from backend, falling back to env/config:', error);
    }

    return new Promise((resolve) => {
      // Logic for GSI initialization kept for compatibility, though we use OAuth2 flow primarily now
      if (typeof window !== 'undefined' && window.google) {
        // ... (existing initialization logic if needed, or just resolve)
        resolve(true);
      } else {
        resolve(true);
      }
    });
  },

  // Handle Google OAuth response (GSI - Google Sign-In)
  // Note: GSI provides a JWT credential, but backend expects OAuth2 access token
  // For GSI, we'll use OAuth2 flow instead to get access token
  handleCredentialResponse: async (response: any) => {
    console.log('Google OAuth Response (GSI):', response);
    console.warn('GSI credential received, but backend expects OAuth2 access token. Redirecting to OAuth2 flow...');

    // For GSI, we need to redirect to OAuth2 flow to get access token
    // Alternatively, we could decode the credential and send email, but backend expects token
    // Redirecting to OAuth2 flow for consistency
    GoogleAuth.signInWithOAuth2();
  },

  // Process access token with backend API
  processAccessTokenWithBackend: async (accessToken: string) => {
    try {
      console.log('Processing access token with backend');

      // Backend expects the access token as a plain string in the request body
      const loginResponse = await fetch(GOOGLE_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(accessToken), // Send token as string
      });

      console.log('Google login response status:', loginResponse.status);

      if (loginResponse.ok) {
        // Google login successful - response is already JSON stringified from backend
        const responseText = await loginResponse.text();
        let userData;
        try {
          userData = JSON.parse(responseText);
        } catch (e) {
          // If already parsed or string, use as is
          userData = responseText;
        }

        console.log('✅ Google login successful, user data:', userData);
        localStorage.setItem('token', typeof userData === 'string' ? userData : JSON.stringify(userData));
        console.log('✅ Token saved to localStorage');

        // Show success message
        toast.success('Login successful!');

        // Clean up OAuth callback parameters and redirect to hash route
        // Simple redirect that works with HashRouter
        setTimeout(() => {
          // Clear URL completely and set hash route
          window.location.replace(window.location.origin + '/#/learner/homepage');
        }, 500); // Small delay to ensure toast is visible
      } else {
        // Google login failed
        const errorText = await loginResponse.text();
        let errorMessage = 'Google login failed. Please try again.';

        try {
          const errorObj = JSON.parse(errorText);
          errorMessage = errorObj.message || errorObj.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        console.error('Google login failed:', errorMessage);
        toast.error(errorMessage);

        // Clean up OAuth callback parameters and redirect to hash route on error
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.pathname = '/';
        url.search = '';
        url.hash = '/login';
        window.history.replaceState({}, '', url.toString());
      }

    } catch (error) {
      console.error('Error processing access token with backend:', error);
      toast.error('Authentication failed. Please try again.');

      // Clean up OAuth callback parameters from URL on error
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.hash = '/login';
      window.history.replaceState({}, '', url.toString());
    }
  },

  // Sign in with Google
  signIn: () => {
    console.log('Google sign in initiated...');
    console.log('Current URL:', window.location.href);
    console.log('Redirect URI:', GOOGLE_CONFIG.redirectUri);
    // Use OAuth 2.0 flow directly for better compatibility
    GoogleAuth.signInWithOAuth2();
  },

  // Fallback OAuth 2.0 flow
  signInWithOAuth2: () => {
    // Check environment variable directly as well (in case GOOGLE_CONFIG wasn't updated)
    const clientId = resolveEnvClientId();

    // Validate client ID before proceeding
    if (!clientId || clientId.trim() === '') {
      console.error('Google Client ID is not configured.');
      console.error('Current value:', clientId);
      console.error('Please ensure REACT_APP_GOOGLE_CLIENT_ID is set in .env file and restart the dev server.');
      toast.error('Google authentication is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID and restart the server.');
      return;
    }

    // Use path-based redirect URI (Google OAuth prefers this)
    // After OAuth, we'll redirect to hash route manually
    const redirectUri = window.location.origin + '/login';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('Redirecting to Google OAuth');
    console.log('Client ID configured:', !!clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Full OAuth URL:', authUrl);
    window.location.href = authUrl;
  },

  // Handle OAuth 2.0 callback
  handleOAuth2Callback: async () => {
    console.log('OAuth 2.0 Callback handler called');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);

    // Google redirects to: http://localhost:3000/?code=...&state=...#/login
    // So the code will be in the query parameters (before the hash)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const code = urlParams.get('code') || hashParams.get('code');
    const error = urlParams.get('error') || hashParams.get('error');

    console.log('OAuth 2.0 Callback - Code:', code, 'Error:', error);

    if (error) {
      console.error('OAuth 2.0 Error:', error);
      toast.error('Google authentication failed. Please try again.');
      // Clean up URL and redirect to login
      const cleanUrl = window.location.origin + '/#/login';
      window.history.replaceState({}, '', cleanUrl);
      window.location.hash = '/login';
      return;
    }

    if (!code) {
      console.warn('No OAuth code found in URL');
      return;
    }

    // Validate client ID and secret (check environment variables directly)
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || GOOGLE_CONFIG.clientId;
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

    if (!clientId || clientId.trim() === '') {
      console.error('Google Client ID is not configured');
      toast.error('Google authentication is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID and restart the server.');
      return;
    }

    if (!clientSecret || clientSecret.trim() === '') {
      console.error('Google Client Secret is not configured');
      toast.error('Google authentication is not configured. Please set REACT_APP_GOOGLE_CLIENT_SECRET and restart the server.');
      return;
    }

    if (code) {
      try {
        console.log('Processing OAuth code with backend...');

        // Use the same redirect URI that was used in the auth request
        const redirectUri = window.location.origin + '/login';

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        console.log('Token data received from Google');

        // Process access token with backend API (backend will fetch user info using token)
        await GoogleAuth.processAccessTokenWithBackend(tokenData.access_token);

      } catch (error: any) {
        console.error('Error processing OAuth callback:', error);
        const errorMessage = error?.message || 'Authentication failed. Please try again.';
        console.error('Error details:', error);
        toast.error(errorMessage);
        // Redirect to hash route and clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.pathname = '/';
        url.search = '';
        url.hash = '/login';
        window.history.replaceState({}, '', url.toString());
      }
    }
  },

  // Sign out
  signOut: () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
      localStorage.removeItem('googleUser');
      localStorage.removeItem('token');
    }
  }
};

// Extend Window interface for Google
declare global {
  interface Window {
    google: any;
  }
}
