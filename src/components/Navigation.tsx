import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PagePermission } from '../types';
import '../styles/MobileNavigation.css';

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
    <>
      <nav className="mobile-nav-top">
        <div className="nav-header">
          <div className="nav-brand">
            <h1 className="nav-brand-title">🚸 Dismissal App</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden-mobile desktop-nav">
            {filteredNavItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`desktop-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-md">
            <div className="nav-user-info hidden-mobile">
              <div className="nav-user-name">{userProfile.displayName || userProfile.email}</div>
              <div className="nav-user-role">{userProfile.role.replace('_', ' ')}</div>
            </div>

            <button
              onClick={handleLogout}
              className="nav-logout-btn"
            >
              <span className="show-mobile-only">👋</span>
              <span className="hidden-mobile">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom tabs style */}
      <div className={`show-mobile-only mobile-bottom-nav`}>
        <div className={`mobile-nav-grid nav-grid-${Math.min(filteredNavItems.length, 5)}`}>
          {filteredNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon">{item.icon}</div>
              <div className="mobile-nav-label">{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;