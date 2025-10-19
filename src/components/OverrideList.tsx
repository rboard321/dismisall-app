import React from 'react';
import { Override, Student } from '../types';

interface OverrideListProps {
  overrides: Override[];
  students: Student[];
  onEdit: (override: Override) => void;
  onDelete: (overrideId: string) => void;
  onToggleActive: (override: Override) => void;
}

const OverrideList: React.FC<OverrideListProps> = ({
  overrides,
  students,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  const getStudentGrade = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? student.grade : '';
  };

  const formatDate = (timestamp: any): string => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStatusColor = (override: Override): string => {
    if (!override.isActive) return '#6c757d';

    const now = new Date();
    const startDate = override.startDate.toDate ? override.startDate.toDate() : override.startDate as any;
    const endDate = override.endDate.toDate ? override.endDate.toDate() : override.endDate as any;

    if (now < startDate) return '#ffc107'; // Future
    if (now > endDate) return '#dc3545'; // Expired
    return '#28a745'; // Active
  };

  const getStatusText = (override: Override): string => {
    if (!override.isActive) return 'Inactive';

    const now = new Date();
    const startDate = override.startDate.toDate ? override.startDate.toDate() : override.startDate as any;
    const endDate = override.endDate.toDate ? override.endDate.toDate() : override.endDate as any;

    if (now < startDate) return 'Future';
    if (now > endDate) return 'Expired';
    return 'Active';
  };

  const isExpired = (override: Override): boolean => {
    const now = new Date();
    const endDate = override.endDate.toDate ? override.endDate.toDate() : override.endDate as any;
    return endDate < now;
  };

  if (overrides.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div style={{ display: 'block' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Student</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Car Number</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Dates</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Reason</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((override, index) => (
                <tr
                  key={override.id}
                  style={{
                    borderBottom: index < overrides.length - 1 ? '1px solid #dee2e6' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                    opacity: override.isActive ? 1 : 0.6
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {getStudentName(override.studentId)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Grade {getStudentGrade(override.studentId)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      Car {override.carNumber}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div><strong>From:</strong> {formatDate(override.startDate)}</div>
                      <div><strong>To:</strong> {formatDate(override.endDate)}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: getStatusColor(override),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(override)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {override.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => onEdit(override)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Edit
                      </button>

                      {!isExpired(override) && (
                        <button
                          onClick={() => onToggleActive(override)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: override.isActive ? '#ffc107' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          {override.isActive ? 'Disable' : 'Enable'}
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(override.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Information */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>Override Information:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li><strong>Active:</strong> Currently affecting student pickup assignments</li>
          <li><strong>Future:</strong> Will become active on the start date</li>
          <li><strong>Expired:</strong> End date has passed, no longer affecting assignments</li>
          <li><strong>Inactive:</strong> Manually disabled by staff</li>
        </ul>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Overrides automatically expire at midnight on their end date. Students will return to their default car assignments after expiration.
        </p>
      </div>
    </div>
  );
};

export default OverrideList;