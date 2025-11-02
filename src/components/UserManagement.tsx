import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole, UserInvitation, PagePermission } from '../types';

interface UserManagementProps {
  users: User[];
  onRoleUpdate: (uid: string, newRole: UserRole) => Promise<void>;
  loading: boolean;
  schoolId: string;
  currentUserUid: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onRoleUpdate, loading, schoolId, currentUserUid }) => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'teacher' as UserRole,
    permissions: ['CAR_LOOKUP', 'MANAGEMENT', 'SETUP'] as PagePermission[]
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Helper function to get default permissions based on role
  const getDefaultPermissions = (role: UserRole): PagePermission[] => {
    switch (role) {
      case 'admin':
        return ['CAR_LOOKUP', 'MANAGEMENT', 'ADMIN', 'CHECKIN', 'OVERRIDES', 'SETUP', 'REPORTS'];
      case 'teacher':
        return ['CAR_LOOKUP', 'MANAGEMENT', 'SETUP'];
      case 'staff':
        return ['CAR_LOOKUP', 'MANAGEMENT'];
      case 'front_office':
        return ['CHECKIN', 'OVERRIDES', 'REPORTS'];
      default:
        return [];
    }
  };

  // Load existing invitations
  const loadInvitations = useCallback(async () => {
    if (!schoolId) return;

    try {
      const invitationsCollection = collection(db, 'invitations');
      const q = query(
        invitationsCollection,
        where('schoolId', '==', schoolId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const invitationsData: UserInvitation[] = [];
      snapshot.forEach((doc) => {
        invitationsData.push({ id: doc.id, ...doc.data() } as UserInvitation);
      });

      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }, [schoolId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // Generate a unique invitation token
  const generateInviteToken = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Send invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFormData.email.trim()) return;

    setInviteLoading(true);
    try {
      // Check if user is already invited or exists
      const existingInvite = invitations.find(
        inv => inv.email === inviteFormData.email && inv.status === 'pending'
      );

      if (existingInvite) {
        alert('This email already has a pending invitation.');
        return;
      }

      // Create invitation
      const inviteToken = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const permissions = inviteFormData.permissions.length > 0
        ? inviteFormData.permissions
        : getDefaultPermissions(inviteFormData.role);

      const newInvitation: Omit<UserInvitation, 'id'> = {
        email: inviteFormData.email.trim().toLowerCase(),
        role: inviteFormData.role,
        permissions,
        schoolId,
        invitedBy: currentUserUid,
        status: 'pending',
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        inviteToken
      };

      const invitationsCollection = collection(db, 'invitations');
      await addDoc(invitationsCollection, newInvitation);

      // Reset form and reload
      setInviteFormData({ email: '', role: 'teacher', permissions: getDefaultPermissions('teacher') });
      setShowInviteForm(false);
      await loadInvitations();

      // Show invite link (in production, this would be sent via email)
      const inviteUrl = `${window.location.origin}/accept-invite?token=${inviteToken}`;
      alert(`Invitation sent! Share this link with the user:\n\n${inviteUrl}\n\n(In production, this would be sent via email)`);

    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

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

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <div>
      {/* Add User Section */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showInviteForm ? '1rem' : '0'
        }}>
          <h3 style={{ margin: 0 }}>Add New User</h3>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {showInviteForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={handleSendInvitation}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Role
                  </label>
                  <select
                    value={inviteFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setInviteFormData(prev => ({
                        ...prev,
                        role: newRole,
                        permissions: getDefaultPermissions(newRole)
                      }))
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="teacher">Teacher (Car + Cone Manager)</option>
                    <option value="staff">Staff (Car Manager Only)</option>
                    <option value="front_office">Front Office</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: inviteLoading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: inviteLoading ? 'not-allowed' : 'pointer',
                    opacity: inviteLoading ? 0.6 : 1
                  }}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
            Pending Invitations ({pendingInvitations.length})
          </h4>
          <div style={{ fontSize: '0.875rem', color: '#856404' }}>
            {pendingInvitations.map(inv => inv.email).join(', ')}
          </div>
        </div>
      )}

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
      {users.length > 0 ? (
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
      ) : (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          color: '#666'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>No Existing Users Found</h3>
          <p style={{ margin: '0 0 1rem 0' }}>
            This could mean users haven't been loaded yet or there may be a permission issue.
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Check the browser console for any error messages, or use the "Add User" button above to invite your first team member.
          </p>
        </div>
      )}

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