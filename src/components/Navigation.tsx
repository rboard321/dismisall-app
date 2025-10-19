import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      allowedRoles: ['admin', 'teacher', 'staff']
    },
    {
      path: '/dashboard',
      label: 'Management',
      icon: '📊',
      allowedRoles: ['admin', 'teacher', 'staff']
    },
    {
      path: '/checkin',
      label: 'Students',
      icon: '👥',
      allowedRoles: ['admin', 'front_office', 'teacher', 'staff']
    },
    {
      path: '/overrides',
      label: 'Overrides',
      icon: '🔄',
      allowedRoles: ['admin', 'front_office']
    },
    {
      path: '/setup',
      label: 'Setup',
      icon: '🔧',
      allowedRoles: ['admin', 'teacher', 'staff']
    },
    {
      path: '/admin',
      label: 'Admin',
      icon: '⚙️',
      allowedRoles: ['admin']
    }
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/');
    }
  };

  const filteredNavItems = navItems.filter(item =>
    item.allowedRoles.includes(userProfile.role)
  );

  return (
    <nav style={{
      backgroundColor: '#343a40',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{
          color: 'white',
          margin: 0,
          fontSize: '1.25rem'
        }}>
          🚸 Dismissal App
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {filteredNavItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
                color: 'white',
                border: location.pathname === item.path ? '1px solid #007bff' : '1px solid transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color: '#adb5bd', fontSize: '0.875rem' }}>
          <div>{userProfile.displayName || userProfile.email}</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
            {userProfile.role.replace('_', ' ')}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;