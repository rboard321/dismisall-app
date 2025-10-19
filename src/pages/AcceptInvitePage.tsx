import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserInvitation } from '../types';

const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, updateUserRole } = useAuth();
  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const token = searchParams.get('token');

  // Load invitation by token
  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const invitationsCollection = collection(db, 'invitations');
        const q = query(invitationsCollection, where('inviteToken', '==', token));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Invitation not found or invalid');
          return;
        }

        const invitationDoc = snapshot.docs[0];
        const invitationData = { id: invitationDoc.id, ...invitationDoc.data() } as UserInvitation;

        // Check if invitation is expired
        const expiresAt = invitationData.expiresAt.toDate ? invitationData.expiresAt.toDate() : new Date(invitationData.expiresAt as any);
        if (expiresAt < new Date()) {
          setError('This invitation has expired');
          return;
        }

        // Check if invitation is already accepted
        if (invitationData.status === 'accepted') {
          setError('This invitation has already been accepted');
          return;
        }

        setInvitation(invitationData);
        setAuthData(prev => ({ ...prev, email: invitationData.email }));

      } catch (error) {
        console.error('Error loading invitation:', error);
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  // Accept invitation after user is authenticated
  const acceptInvitation = async () => {
    if (!invitation || !currentUser) return;

    try {
      setLoading(true);

      // Update user profile with school and role
      await updateUserRole(currentUser.uid, invitation.role, invitation.schoolId);

      // Mark invitation as accepted
      const invitationDoc = doc(db, 'invitations', invitation.id);
      await updateDoc(invitationDoc, {
        status: 'accepted',
        acceptedAt: Timestamp.now()
      });

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation. Please try again.');
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // acceptInvitation will be called by useEffect when currentUser changes
    } catch (error: any) {
      console.error('Error with Google sign in:', error);
      setError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Handle email/password authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (authMode === 'signup' && authData.password !== authData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      } else {
        await signInWithEmailAndPassword(auth, authData.email, authData.password);
      }
      // acceptInvitation will be called by useEffect when currentUser changes
    } catch (error: any) {
      console.error('Error with email authentication:', error);
      setError(error.message || 'Authentication failed');
      setLoading(false);
    }
  };

  // Accept invitation when user becomes authenticated
  useEffect(() => {
    if (currentUser && invitation && !loading) {
      acceptInvitation();
    }
  }, [currentUser, invitation]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading invitation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Invitation Error</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>You're Invited!</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Join as a <strong style={{ textTransform: 'capitalize' }}>
              {invitation.role.replace('_', ' ')}
            </strong>
          </p>
        </div>

        {/* Invitation Details */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          marginBottom: '2rem'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Email:</strong> {invitation.email}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>
              {invitation.role.replace('_', ' ')}
            </span>
          </div>
          <div>
            <strong>Expires:</strong> {invitation.expiresAt.toDate ?
              invitation.expiresAt.toDate().toLocaleDateString() :
              new Date(invitation.expiresAt as any).toLocaleDateString()
            }
          </div>
        </div>

        {/* Authentication Options */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Sign in to accept</h3>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🔗</span>
            Sign in with Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0',
            color: '#666'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }}></div>
            <div style={{ padding: '0 1rem', fontSize: '0.875rem' }}>OR</div>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }}></div>
          </div>

          {/* Auth Mode Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button
              onClick={() => setAuthMode('signin')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: authMode === 'signin' ? '#007bff' : 'transparent',
                color: authMode === 'signin' ? 'white' : '#007bff',
                border: '1px solid #007bff',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: authMode === 'signup' ? '#007bff' : 'transparent',
                color: authMode === 'signup' ? 'white' : '#007bff',
                border: '1px solid #007bff',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Email
              </label>
              <input
                type="email"
                value={authData.email}
                onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                disabled={true} // Email is pre-filled from invitation
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  color: '#666'
                }}
              />
            </div>

            {authMode === 'signup' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={authData.displayName}
                  onChange={(e) => setAuthData(prev => ({ ...prev, displayName: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Password
              </label>
              <input
                type="password"
                value={authData.password}
                onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>

            {authMode === 'signup' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={authData.confirmPassword}
                  onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Processing...' : `${authMode === 'signin' ? 'Sign In' : 'Sign Up'} & Accept Invitation`}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              border: '1px solid #f5c6cb',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;