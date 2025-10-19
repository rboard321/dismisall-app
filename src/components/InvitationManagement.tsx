import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserInvitation, UserRole } from '../types';

interface InvitationManagementProps {
  schoolId: string;
  currentUserUid: string;
}

const InvitationManagement: React.FC<InvitationManagementProps> = ({ schoolId, currentUserUid }) => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'teacher' as UserRole
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

      const newInvitation: Omit<UserInvitation, 'id'> = {
        email: inviteFormData.email.trim().toLowerCase(),
        role: inviteFormData.role,
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
      setInviteFormData({ email: '', role: 'teacher' });
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
          <form onSubmit={handleSendInvitation} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
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
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Role
              </label>
              <select
                value={inviteFormData.role}
                onChange={(e) => setInviteFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
                <option value="front_office">Front Office</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
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
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Sent</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Expires</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation, index) => (
                <tr
                  key={invitation.id}
                  style={{
                    borderBottom: index < invitations.length - 1 ? '1px solid #dee2e6' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {invitation.email}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: getRoleColor(invitation.role),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {invitation.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: getStatusColor(invitation.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {invitation.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {formatDate(invitation.createdAt)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ color: isExpired(invitation.expiresAt) ? '#dc3545' : 'inherit' }}>
                      {formatDate(invitation.expiresAt)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                          disabled={loading}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={loading}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem'
                          }}
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