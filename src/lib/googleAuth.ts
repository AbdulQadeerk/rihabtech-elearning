import { API_BASE_URL } from './api';
import { toast } from 'sonner';
import { fetchPublicSettings } from './configService';

// Google login endpoint
const GOOGLE_LOGIN_ENDPOINT = `${API_BASE_URL}auth/google/login`;

// Google OAuth Configuration
export const getGoogleConfig = async () => {
  const settings = await fetchPublicSettings();
  return {
    clientId: settings.googleClientId,
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/login' : '',
    scope: "openid profile email",
  };
};

export const GOOGLE_CONFIG = {
  clientId: '', // Will be populated by getGoogleConfig() or init()
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/login' : '',
  scope: "openid profile email",
};

// Google OAuth Helper Functions
export const GoogleAuth = {
  // Initialize Google OAuth
  init: async () => {
    try {
      const settings = await fetchPublicSettings();
      if (settings.googleClientId) {
        console.log('✅ Fetched Google Client ID from backend:', settings.googleClientId.substring(0, 10) + '...');
        GOOGLE_CONFIG.clientId = settings.googleClientId;
      }
    } catch (error) {
      console.warn('Failed to fetch Google Client ID from backend:', error);
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
    GoogleAuth.signInWithOAuth2();
  },

  // Fallback OAuth 2.0 flow
  signInWithOAuth2: async () => {
    const settings = await fetchPublicSettings();
    const clientId = settings.googleClientId;

    if (!clientId) {
      console.error('Google Client ID is not configured.');
      toast.error('Google authentication is not configured.');
      return;
    }

    const redirectUri = window.location.origin + '/login';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  },

  // Handle OAuth 2.0 callback
  handleOAuth2Callback: async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const code = urlParams.get('code') || hashParams.get('code');
    const error = urlParams.get('error') || hashParams.get('error');

    if (error) {
      toast.error('Google authentication failed.');
      window.location.hash = '/login';
      return;
    }

    if (!code) return;

    try {
      const redirectUri = window.location.origin + '/login';

      const response = await fetch(`${API_BASE_URL}auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: redirectUri
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const userData = await response.json();
      localStorage.setItem('token', typeof userData === 'string' ? userData : JSON.stringify(userData));
      toast.success('Login successful!');

      setTimeout(() => {
        window.location.replace(window.location.origin + '/#/learner/homepage');
      }, 500);

    } catch (error: any) {
      console.error('Error processing OAuth callback:', error);
      toast.error('Authentication failed. Please try again.');
      window.location.hash = '/login';
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
