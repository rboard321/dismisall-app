import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import RoleAssignment from './RoleAssignment';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin', 'teacher', 'staff', 'front_office'],
  requireAuth = true
}) => {
  const { currentUser, userProfile, loading, updateUserRole } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if authentication is required and user is not logged in
  if (requireAuth && !currentUser) {
    return <Navigate to="/" replace />;
  }

  // Show role assignment if user is logged in but has no profile
  if (requireAuth && currentUser && !userProfile) {
    return (
      <RoleAssignment
        onRoleAssign={async (role, schoolId) => {
          await updateUserRole(currentUser.uid, role, schoolId);
          window.location.reload(); // Refresh to load new profile
        }}
        isNewUser={true}
      />
    );
  }

  // Check if user has required role
  if (requireAuth && userProfile && !allowedRoles.includes(userProfile.role)) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '5rem',
        padding: '2rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Your current role: <strong>{userProfile.role}</strong></p>
        <p>Required roles: <strong>{allowedRoles.join(', ')}</strong></p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;