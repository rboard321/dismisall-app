import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface SchoolFormData {
  schoolName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  website: string;
  timezone: string;
}

const SchoolSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, reloadUserProfile } = useAuth();
  const [formData, setFormData] = useState<SchoolFormData>({
    schoolName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    website: '',
    timezone: 'America/New_York'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/signup');
    } else if (userProfile) {
      // User already has a profile, go to dashboard
      navigate('/dashboard');
    }
  }, [currentUser, userProfile, navigate]);

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSchoolSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be signed in to set up a school');
      return;
    }

    // Validate required fields
    if (!formData.schoolName.trim()) {
      setError('School name is required');
      return;
    }

    setLoading(true);
    try {
      // Create school document
      const schoolData = {
        name: formData.schoolName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        timezone: formData.timezone,
        settings: {
          defaultConeCount: 4,
          dismissalStartTime: '14:30',
          dismissalEndTime: '15:30',
          autoClearEnabled: true,
          autoClearDelayMinutes: 2
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        trialEndsAt: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
        subscriptionStatus: 'trial'
      };

      const schoolRef = await addDoc(collection(db, 'schools'), schoolData);

      // Create user profile with admin permissions
      const userProfile = {
        uid: currentUser.uid,
        email: currentUser.email!,
        displayName: currentUser.displayName || currentUser.email!.split('@')[0],
        role: 'admin' as const,
        schoolId: schoolRef.id,
        permissions: ['CAR_LOOKUP', 'MANAGEMENT', 'ADMIN', 'CHECKIN', 'OVERRIDES', 'SETUP', 'REPORTS'],
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };

      await setDoc(doc(db, 'users', currentUser.uid), userProfile);

      // Wait for the user profile to be reloaded in the AuthContext
      await reloadUserProfile();

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating school:', error);
      setError('Failed to create school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (!currentUser) {
    return null; // Will redirect via useEffect
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
        maxWidth: '600px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '0.5rem'
          }}>
            🏫 Set Up Your School
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
            Welcome, {currentUser.displayName || currentUser.email}!
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Tell us about your school to complete the setup
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #f5c6cb',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSchoolSetup}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              School Name *
            </label>
            <input
              type="text"
              value={formData.schoolName}
              onChange={(e) => handleInputChange('schoolName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter your school name"
              disabled={loading}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Street address"
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                disabled={loading}
              >
                <option value="">Select</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="(555) 123-4567"
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                disabled={loading}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
              Website (Optional)
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="https://www.yourschool.edu"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.schoolName.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading || !formData.schoolName.trim() ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !formData.schoolName.trim() ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Setting Up School...' : 'Complete School Setup'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e9ecef',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          Need help? Contact support or{' '}
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

export default SchoolSetupPage;