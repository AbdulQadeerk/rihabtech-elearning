// Utility functions for authentication

export const getAuthToken = (): string | null => {
  try {
    const userData = localStorage.getItem('token');
    console.log('🔍 Debug - Raw userData from localStorage:', userData);
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('🔍 Debug - Parsed user object:', user);
      console.log('🔍 Debug - AccessToken:', user.AccessToken);
      return user.AccessToken || null;
    }
    console.log('🔍 Debug - No userData found in localStorage');
    console.log('🔍 Debug - All localStorage keys:', Object.keys(localStorage));
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getUserData = () => {
  try {
    const userData = localStorage.getItem('token');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return token !== null && token !== undefined && token !== '';
};

export const clearAuth = () => {
  localStorage.removeItem('token');
};
