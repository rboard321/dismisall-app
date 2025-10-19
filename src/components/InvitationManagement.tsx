import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserInvitation, UserRole, PagePermission } from '../types';

interface InvitationManagementProps {
  schoolId: string;
  currentUserUid: string;
}

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

const InvitationManagement: React.FC<InvitationManagementProps> = ({ schoolId, currentUserUid }) => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'teacher' as UserRole,
    permissions: getDefaultPermissions('teacher') as PagePermission[]
  });

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

    setLoading(true);
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
      setLoading(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;

    setLoading(true);
    try {
      const invitationDoc = doc(db, 'invitations', invitationId);
      await updateDoc(invitationDoc, {
        status: 'expired'
      });

      await loadInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend invitation (generate new token)
  const handleResendInvitation = async (invitationId: string, email: string) => {
    setLoading(true);
    try {
      const newToken = generateInviteToken();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const invitationDoc = doc(db, 'invitations', invitationId);
      await updateDoc(invitationDoc, {
        inviteToken: newToken,
        expiresAt: Timestamp.fromDate(newExpiresAt),
        status: 'pending'
      });

      await loadInvitations();

      // Show new invite link
      const inviteUrl = `${window.location.origin}/accept-invite?token=${newToken}`;
      alert(`New invitation link generated for ${email}:\n\n${inviteUrl}\n\n(In production, this would be sent via email)`);

    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
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

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const isExpired = (expiresAt: any): boolean => {
    if (!expiresAt) return false;
    const expireDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return expireDate < new Date();
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expiresAt));
  const expiredInvitations = invitations.filter(inv => inv.status === 'expired' || isExpired(inv.expiresAt));
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  return (
    <div>
      {/* Send Invitation Section */}
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
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0 }}>Invite New Users</h3>
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
            {showInviteForm ? 'Cancel' : '+ Send Invitation'}
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={handleSendInvitation}>
            <div className="grid gap-lg">
              {/* Email and Role Row */}
              <div className="grid grid-2-mobile-1 gap-md">
                <div className="form-group">
                  <label className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
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
                    className="form-select"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                    <option value="front_office">Front Office</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Custom Permissions Section */}
              <div className="form-group">
                <label className="form-label mb-2">
                  Page Access Permissions
                </label>
                <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="card-body">
                    <p className="text-sm text-muted mb-3">
                      Select which pages this user can access. Defaults are set based on role, but you can customize them.
                    </p>
                    <div className="grid grid-2-mobile-1 gap-sm">
                      {[
                        { key: 'CAR_LOOKUP', label: 'Car Lookup', icon: '🔍', description: 'Find and queue cars' },
                        { key: 'MANAGEMENT', label: 'Management', icon: '📊', description: 'Cone queue management' },
                        { key: 'CHECKIN', label: 'Student Check-in', icon: '👥', description: 'Check students in/out' },
                        { key: 'OVERRIDES', label: 'Overrides', icon: '🔄', description: 'Override dismissal rules' },
                        { key: 'SETUP', label: 'Teacher Setup', icon: '🔧', description: 'Manage students and cars' },
                        { key: 'ADMIN', label: 'Admin Panel', icon: '⚙️', description: 'Full admin access' },
                        { key: 'REPORTS', label: 'Reports', icon: '📈', description: 'View analytics and reports' }
                      ].map(permission => (
                        <label
                          key={permission.key}
                          className="flex items-center gap-sm p-2"
                          style={{
                            cursor: 'pointer',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                            backgroundColor: inviteFormData.permissions.includes(permission.key as PagePermission)
                              ? '#e7f3ff'
                              : 'white'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={inviteFormData.permissions.includes(permission.key as PagePermission)}
                            onChange={(e) => {
                              const perm = permission.key as PagePermission;
                              setInviteFormData(prev => ({
                                ...prev,
                                permissions: e.target.checked
                                  ? [...prev.permissions, perm]
                                  : prev.permissions.filter(p => p !== perm)
                              }))
                            }}
                            style={{ minWidth: '16px', minHeight: '16px' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-xs">
                              <span>{permission.icon}</span>
                              <span className="font-semibold text-sm">{permission.label}</span>
                            </div>
                            <div className="text-xs text-muted">{permission.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Invitation Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
            {pendingInvitations.length}
          </div>
          <div style={{ color: '#856404' }}>Pending</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
            {acceptedInvitations.length}
          </div>
          <div style={{ color: '#155724' }}>Accepted</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#721c24' }}>
            {expiredInvitations.length}
          </div>
          <div style={{ color: '#721c24' }}>Expired</div>
        </div>
      </div>

      {/* Invitations List */}
      {invitations.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <h3 className="m-0 mb-3">All Invitations</h3>

            {/* Desktop Table */}
            <div className="hidden-mobile table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Expires</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        {invitation.email}
                      </td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: getRoleColor(invitation.role),
                          color: 'white'
                        }}>
                          {invitation.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-xs">
                          {invitation.permissions.slice(0, 3).map(perm => (
                            <span key={perm} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                              {perm.replace('_', ' ')}
                            </span>
                          ))}
                          {invitation.permissions.length > 3 && (
                            <span className="badge" style={{ backgroundColor: '#6c757d', color: 'white', fontSize: '0.7rem' }}>
                              +{invitation.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: getStatusColor(invitation.status),
                          color: 'white'
                        }}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="text-sm">
                        {formatDate(invitation.createdAt)}
                      </td>
                      <td className="text-sm">
                        <div style={{ color: isExpired(invitation.expiresAt) ? '#dc3545' : 'inherit' }}>
                          {formatDate(invitation.expiresAt)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                          <div className="flex gap-xs justify-center">
                            <button
                              onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                              disabled={loading}
                              className="btn btn-primary btn-sm"
                              style={{ opacity: loading ? 0.6 : 1 }}
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={loading}
                              className="btn btn-danger btn-sm"
                              style={{ opacity: loading ? 0.6 : 1 }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="show-mobile-only grid gap-md">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="card" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold">{invitation.email}</div>
                      <span className="badge" style={{
                        backgroundColor: getStatusColor(invitation.status),
                        color: 'white'
                      }}>
                        {invitation.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-sm mb-2">
                      <span className="text-sm text-muted">Role:</span>
                      <span className="badge" style={{
                        backgroundColor: getRoleColor(invitation.role),
                        color: 'white'
                      }}>
                        {invitation.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="text-sm text-muted mb-1">Permissions:</div>
                      <div className="flex flex-wrap gap-xs">
                        {invitation.permissions.map(perm => (
                          <span key={perm} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {perm.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-2 gap-sm mb-3 text-sm text-muted">
                      <div>
                        <div>Sent: {formatDate(invitation.createdAt)}</div>
                      </div>
                      <div>
                        <div style={{ color: isExpired(invitation.expiresAt) ? '#dc3545' : 'inherit' }}>
                          Expires: {formatDate(invitation.expiresAt)}
                        </div>
                      </div>
                    </div>

                    {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                      <div className="flex gap-sm">
                        <button
                          onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                          disabled={loading}
                          className="btn btn-primary btn-sm flex-1"
                          style={{ opacity: loading ? 0.6 : 1 }}
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={loading}
                          className="btn btn-danger btn-sm flex-1"
                          style={{ opacity: loading ? 0.6 : 1 }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3>No Invitations Yet</h3>
          <p>Send your first invitation to add team members to your school.</p>
        </div>
      )}
    </div>
  );
};

export default InvitationManagement;