import React, { useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);

  useEffect(() => {
    if (currentUser && userProfile) {
      navigate('/dashboard');
    }
  }, [currentUser, userProfile, navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setAuthLoading(true);
    try {
      // Try popup first, fallback to redirect if blocked
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google login error:', error);

      // If popup blocked, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Google redirect error:', redirectError);
          alert('Login failed. Please try email login or check popup blockers.');
        }
      } else {
        alert('Login failed. Please try again or use email login.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      let message = 'Authentication failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Account already exists. Please sign in instead.';
      }
      alert(message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '5rem auto',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>
        🚸 Dismissal App
      </h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Secure school dismissal management system
      </p>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '2rem',
        backgroundColor: 'white'
      }}>
        <form onSubmit={handleEmailAuth} style={{ marginBottom: '1.5rem' }}>
          <h3>{isSignUp ? 'Create Account' : 'Sign In'}</h3>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: authLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: authLoading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {authLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>

        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '1.5rem'
        }}>
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: authLoading ? '#ccc' : '#dd4b39',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: authLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {authLoading ? 'Please wait...' : '🔐 Sign in with Google'}
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <strong>First time user?</strong> After signing in, you'll need to set up
        your role and school affiliation.
      </div>
    </div>
  );
};

export default LoginPage;
