import React, { useState } from 'react';
import { UserRole } from '../types';

interface RoleAssignmentProps {
  onRoleAssign: (role: UserRole, schoolId: string) => Promise<void>;
  isNewUser?: boolean;
}

const RoleAssignment: React.FC<RoleAssignmentProps> = ({ onRoleAssign, isNewUser = false }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim()) return;

    setLoading(true);
    try {
      await onRoleAssign(selectedRole, schoolId.trim());
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error assigning role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions = {
    admin: 'Full access - manage students, cars, cones, overrides, and reports',
    teacher: 'Lane Runner - mark cars as arrived, assign cones, and dismiss students',
    staff: 'Lane Runner - mark cars as arrived, assign cones, and dismiss students',
    front_office: 'Front Office - edit overrides and assign temporary pickups'
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h2>{isNewUser ? 'Welcome! Set up your account' : 'Assign User Role'}</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="schoolId" style={{ display: 'block', marginBottom: '0.5rem' }}>
            School ID *
          </label>
          <input
            type="text"
            id="schoolId"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            placeholder="Enter your school's unique ID"
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="schoolName" style={{ display: 'block', marginBottom: '0.5rem' }}>
            School Name (optional)
          </label>
          <input
            type="text"
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Your school's name"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Your Role *
          </label>
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start' }}>
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  style={{ marginRight: '0.5rem', marginTop: '0.2rem' }}
                />
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {role.replace('_', ' ')}
                  </strong>
                  <br />
                  <small style={{ color: '#666' }}>{description}</small>
                </div>
              </label>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !schoolId.trim()}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </form>

      {isNewUser && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <small style={{ color: '#666' }}>
            <strong>New to the app?</strong> Contact your school administrator
            to get your School ID and confirm your role assignment.
          </small>
        </div>
      )}
    </div>
  );
};

export default RoleAssignment;