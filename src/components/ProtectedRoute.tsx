import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, PagePermission } from '../types';
import RoleAssignment from './RoleAssignment';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: PagePermission[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin', 'teacher', 'staff', 'front_office'],
  requiredPermissions = [],
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

  // Check permissions if specified, otherwise fall back to role check
  if (requireAuth && userProfile) {
    let hasAccess = false;

    // Admin users always have access to everything
    if (userProfile.role === 'admin') {
      hasAccess = true;
    } else if (requiredPermissions.length > 0) {
      // Check if user has all required permissions
      const userPermissions = userProfile.permissions || [];
      hasAccess = requiredPermissions.every(permission => userPermissions.includes(permission));
    } else {
      // Fall back to role-based access
      hasAccess = allowedRoles.includes(userProfile.role);
    }

    if (!hasAccess) {
      return (
        <div style={{
          textAlign: 'center',
          marginTop: '5rem',
          padding: '2rem'
        }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Your current role: <strong>{userProfile.role}</strong></p>
          {requiredPermissions.length > 0 && (
            <p>Required permissions: <strong>{requiredPermissions.join(', ')}</strong></p>
          )}
          {requiredPermissions.length === 0 && (
            <p>Required roles: <strong>{allowedRoles.join(', ')}</strong></p>
          )}
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
  }

  return <>{children}</>;
};

export default ProtectedRoute;