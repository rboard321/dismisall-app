import React from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onRoleUpdate: (uid: string, newRole: UserRole) => Promise<void>;
  loading: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onRoleUpdate, loading }) => {
  const roleDescriptions = {
    admin: 'Full access - manage all aspects of the system',
    teacher: 'Lane Runner - manage dismissal process and car assignments',
    staff: 'Lane Runner - manage dismissal process and car assignments',
    front_office: 'Front Office - manage students, overrides, and daily operations'
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'teacher': return '#007bff';
      case 'staff': return '#6f42c1';
      case 'front_office': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatLastLogin = (timestamp: any): string => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      await onRoleUpdate(uid, newRole);
    }
  };

  if (users.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#666'
      }}>
        <h3>No users found</h3>
        <p>Users will appear here once they sign up and are assigned to this school.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
            {users.length}
          </div>
          <div style={{ color: '#666' }}>Total Users</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffeaa7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div style={{ color: '#856404' }}>Admins</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
            {users.filter(u => u.role === 'teacher' || u.role === 'staff').length}
          </div>
          <div style={{ color: '#155724' }}>Lane Runners</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#cce5ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>
            {users.filter(u => u.role === 'front_office').length}
          </div>
          <div style={{ color: '#004085' }}>Front Office</div>
        </div>
      </div>

      {/* User List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Current Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Last Login</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.uid}
                style={{
                  borderBottom: index < users.length - 1 ? '1px solid #dee2e6' : 'none',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {user.displayName || 'Unknown User'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {user.email}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getRoleColor(user.role),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {user.role.replace('_', ' ')}
                  </span>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginTop: '0.25rem'
                  }}>
                    {roleDescriptions[user.role]}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    {formatLastLogin(user.lastLogin)}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                    disabled={loading}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="front_office">Front Office</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Information */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Role Permissions</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div
              key={role}
              style={{
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: getRoleColor(role as UserRole),
                  borderRadius: '50%',
                  marginRight: '0.5rem'
                }}></span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {role.replace('_', ' ')}
                </strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#856404'
      }}>
        <strong>⚠️ Warning:</strong> Changing user roles takes effect immediately.
        Make sure users understand their new permissions before making changes.
      </div>
    </div>
  );
};

export default UserManagement;