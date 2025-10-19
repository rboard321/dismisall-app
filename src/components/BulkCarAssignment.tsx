import React, { useState } from 'react';
import { Student } from '../types';

interface BulkCarAssignmentProps {
  selectedStudents: Student[];
  onAssign: (studentIds: string[], carNumber: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const BulkCarAssignment: React.FC<BulkCarAssignmentProps> = ({
  selectedStudents,
  onAssign,
  onCancel,
  loading
}) => {
  const [carNumber, setCarNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carNumber.trim()) {
      setError('Please enter a car number');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('No students selected');
      return;
    }

    try {
      await onAssign(selectedStudents.map(s => s.id), carNumber.trim());
      setCarNumber('');
      setError('');
    } catch (error) {
      setError('Failed to assign car numbers. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>Bulk Car Assignment</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Assign car number to {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}
        </p>

        {/* Selected Students Preview */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <strong>Selected Students:</strong>
          <div style={{ marginTop: '0.5rem' }}>
            {selectedStudents.map(student => (
              <div key={student.id} style={{
                padding: '0.25rem 0',
                borderBottom: '1px solid #dee2e6',
                fontSize: '0.875rem'
              }}>
                {student.firstName} {student.lastInitial || (student.lastName ? student.lastName.charAt(0).toUpperCase() : '')}.
                {student.defaultCarNumber && (
                  <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                    (currently: Car {student.defaultCarNumber})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Car Number Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Car Number
            </label>
            <input
              type="text"
              value={carNumber}
              onChange={(e) => {
                setCarNumber(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: error ? '2px solid #dc3545' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter car number (e.g., 123, A5, etc.)"
              disabled={loading}
            />
            {error && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {error}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !carNumber.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading || !carNumber.trim() ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !carNumber.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Assigning...' : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>

        {/* Information */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#004085'
        }}>
          <strong>ℹ️ Note:</strong> This will update the default car number for all selected students.
          Students who currently have car assignments will be reassigned to the new car number.
        </div>
      </div>
    </div>
  );
};

export default BulkCarAssignment;