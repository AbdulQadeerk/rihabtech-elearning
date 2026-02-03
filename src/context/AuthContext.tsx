import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Custom user type that includes both Firebase and localStorage user data
interface CustomUser {
  Role: number;
  uid: string;
  email: string | null;
  displayName?: string | null;
  // Add custom fields from localStorage
  UserName?: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  AccessToken?: string;
  ProfileImage?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshAuth: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for user in localStorage and Firebase
  const checkAuthState = () => {
    try {
      // First, check localStorage for token-based auth
      const tokenData = localStorage.getItem('token');
      if (tokenData) {
        const userData = JSON.parse(tokenData);
        console.log('Found user in localStorage:', userData);
        
        // Create a standardized user object
        const customUser: CustomUser = {
          uid: userData.id?.toString() || userData.Id?.toString() || 'localStorage-user',
          email: userData.UserName || userData.email || userData.emailId,
          displayName: userData.name || userData.Name,
          UserName: userData.UserName,
          name: userData.name || userData.Name,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          Role: userData.Role || userData.role || 0,
          AccessToken: userData.AccessToken,
          ProfileImage: userData.ProfileImage || userData.profileImage,
        };
        
        setUser(customUser);
        setLoading(false);
        return;
      } else {
        // No token in localStorage, set loading to false
        console.log('No token found in localStorage');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error parsing localStorage token:', error);
      // Even if there's an error, we should set loading to false
      setLoading(false);
    }
    
    // If no localStorage user, the Firebase listener will handle it
  };

  useEffect(() => {
    // Check localStorage first
    checkAuthState();

    // Add a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth timeout fallback - setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('Token changed in localStorage, refreshing auth state');
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser && !localStorage.getItem('token')) {
          // Only use Firebase user if no localStorage token exists
          const customUser: CustomUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            Role: 0, // Default role for Firebase-only users
            ProfileImage: firebaseUser.photoURL || undefined,
          };
          setUser(customUser);
        } else if (!firebaseUser && !localStorage.getItem('token')) {
          // No user in either system
          setUser(null);
        }
      } catch (error) {
        console.error('Error in Firebase auth listener:', error);
        setUser(null);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId); // Clear timeout since auth is complete
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    try {
      // Sign out from Firebase if user is signed in
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
    }
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.setItem('logoutSuccess', 'true');
    setUser(null);
  };

  const refreshAuth = () => {
    checkAuthState();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 