import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AccountSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [setupType, setSetupType] = useState<'school' | 'invitation' | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;

    setLoading(true);
    try {
      // Redirect to accept invite page with the token
      navigate(`/accept-invite?token=${invitationCode.trim()}`);
    } catch (error) {
      console.error('Error joining with code:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '0.5rem'
          }}>
            🚸 Welcome to Dismissal App
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
            Hello, {currentUser.displayName || currentUser.email}!
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Let's get your account set up
          </p>
        </div>

        {!setupType && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
              How would you like to get started?
            </h3>

            {/* Create School Option */}
            <div
              onClick={() => setSetupType('school')}
              style={{
                padding: '2rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                marginBottom: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#f8f9fa'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.backgroundColor = '#f0f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                🏫 Create a New School Account
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                Set up a new school with full administrative access. You'll be able to invite teachers and staff.
              </p>
            </div>

            {/* Join with Code Option */}
            <div
              onClick={() => setSetupType('invitation')}
              style={{
                padding: '2rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#f8f9fa'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.backgroundColor = '#f0f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                📧 Join with Invitation Code
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                Have an invitation code from your school administrator? Enter it here to join your school.
              </p>
            </div>
          </div>
        )}

        {setupType === 'school' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
              Create Your School Account
            </h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              You'll be redirected to set up your school information and become the administrator.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setSetupType(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Back
              </button>
              <button
                onClick={() => navigate('/school-setup')}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Continue to School Setup
              </button>
            </div>
          </div>
        )}

        {setupType === 'invitation' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
              Enter Your Invitation Code
            </h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Your school administrator should have provided you with an invitation link or code.
            </p>

            <form onSubmit={handleJoinWithCode}>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="Paste invitation code here"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSetupType(null)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !invitationCode.trim()}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    backgroundColor: loading || !invitationCode.trim() ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading || !invitationCode.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Joining...' : 'Join School'}
                </button>
              </div>
            </form>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              fontSize: '0.85rem',
              color: '#0066cc'
            }}>
              💡 <strong>Tip:</strong> If you received an invitation link via email,
              you can click that link directly instead of entering the code here.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e9ecef',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          Need help? Contact your school administrator or{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            sign out and try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupPage;