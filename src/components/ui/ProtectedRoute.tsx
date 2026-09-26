import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileCompletionModal from './ProfileCompletionModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isProfileComplete, setProfileComplete } = useAuth();
  const token = localStorage.getItem('token');
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      {children}
      {!isProfileComplete && user && (
        <ProfileCompletionModal
          userName={user.name || user.displayName || ''}
          userEmail={user.email || user.UserName || ''}
          onComplete={() => {
            setProfileComplete();
            // Force a page reload to refresh the user data
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

export default ProtectedRoute;