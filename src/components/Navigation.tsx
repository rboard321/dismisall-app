import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PagePermission } from '../types';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();

  if (!userProfile) return null;

  const navItems = [
    {
      path: '/car-lookup',
      label: 'Car Lookup',
      icon: '🔍',
      requiredPermission: 'CAR_LOOKUP' as PagePermission
    },
    {
      path: '/dashboard',
      label: 'Management',
      icon: '📊',
      requiredPermission: 'MANAGEMENT' as PagePermission
    },
    {
      path: '/checkin',
      label: 'Students',
      icon: '👥',
      requiredPermission: 'CHECKIN' as PagePermission
    },
    {
      path: '/overrides',
      label: 'Overrides',
      icon: '🔄',
      requiredPermission: 'OVERRIDES' as PagePermission
    },
    {
      path: '/setup',
      label: 'Setup',
      icon: '🔧',
      requiredPermission: 'SETUP' as PagePermission
    },
    {
      path: '/admin',
      label: 'Admin',
      icon: '⚙️',
      requiredPermission: 'ADMIN' as PagePermission
    }
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/');
    }
  };

  const filteredNavItems = navItems.filter(item => {
    // Admin users always have access to everything
    if (userProfile.role === 'admin') {
      return true;
    }

    // Check if user has the required permission
    const userPermissions = userProfile.permissions || [];
    return userPermissions.includes(item.requiredPermission);
  });

  return (
    <nav
      style={{ backgroundColor: '#343a40' }}
      className="p-3 flex justify-between items-center flex-wrap gap-md"
    >
      <div className="flex items-center gap-md">
        <h1 className="text-xl font-semibold m-0" style={{ color: 'white' }}>
          🚸 Dismissal App
        </h1>

        {/* Desktop Navigation */}
        <div className="hidden-mobile flex gap-sm">
          {filteredNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`btn btn-sm ${location.pathname === item.path ? 'btn-primary' : ''}`}
              style={{
                backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
                color: 'white',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent'
              }}
            >
              <span>{item.icon}</span>
              <span className="hidden-mobile">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-md">
        <div className="text-sm hidden-mobile" style={{ color: '#adb5bd' }}>
          <div>{userProfile.displayName || userProfile.email}</div>
          <div className="text-xs" style={{ textTransform: 'capitalize' }}>
            {userProfile.role.replace('_', ' ')}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-danger btn-sm"
        >
          <span className="show-mobile-only">👋</span>
          <span className="hidden-mobile">Logout</span>
        </button>
      </div>

      {/* Mobile Navigation - Bottom tabs style */}
      <div className="show-mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#343a40',
        borderTop: '1px solid #495057',
        padding: '0.5rem',
        zIndex: 1000
      }}>
        <div className="grid gap-xs" style={{
          gridTemplateColumns: `repeat(${Math.min(filteredNavItems.length, 5)}, 1fr)`
        }}>
          {filteredNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="btn btn-sm text-center"
              style={{
                backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 0.25rem',
                flexDirection: 'column',
                fontSize: '0.75rem',
                minHeight: '60px'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.6rem', lineHeight: 1 }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;