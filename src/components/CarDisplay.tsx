import React from 'react';
import { CarWithStudents } from '../types';

interface CarDisplayProps {
  car: CarWithStudents;
  onDismiss: () => void;
  onClear: () => void;
  loading: boolean;
}

const CarDisplay: React.FC<CarDisplayProps> = ({ car, onDismiss, onClear, loading }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'queued': return '#ffc107';
      case 'sent': return '#17a2b8';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'sent': return 'Students Sent';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const isAlreadyDismissed = car.status === 'completed';

  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1rem'
    }}>
      {/* Car Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #dee2e6'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            color: '#007bff'
          }}>
            🚗 Car {car.carNumber}
          </h2>
          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.25rem'
          }}>
            {car.coneNumber ? `Assigned to Cone ${car.coneNumber}` : 'No cone assigned'}
          </div>
        </div>

        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: getStatusColor(car.status),
          color: 'white',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {getStatusText(car.status)}
        </div>
      </div>

      {/* Students List */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          margin: '0 0 0.75rem 0',
          fontSize: '1rem',
          color: '#333'
        }}>
          Students ({car.students.length})
        </h4>

        <div style={{
          display: 'grid',
          gap: '0.5rem'
        }}>
          {car.students.map((student) => (
            <div
              key={student.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: student.isOverride ? '#fff3cd' : '#f8f9fa',
                border: student.isOverride ? '1px solid #ffeaa7' : '1px solid #dee2e6',
                borderRadius: '4px'
              }}
            >
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {student.displayName}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#666'
                }}>
                  Grade {student.grade}
                </div>
              </div>

              {student.isOverride && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#856404',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  OVERRIDE
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Override Information */}
      {car.overrides && car.overrides.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
            ⚠️ Active Overrides
          </h5>
          {car.overrides.map((override) => (
            <div key={override.id} style={{ fontSize: '0.875rem', color: '#856404' }}>
              {override.reason && `Reason: ${override.reason}`}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onClear}
          disabled={loading}
          style={{
            flex: '1',
            padding: '0.75rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          Clear
        </button>

        {!isAlreadyDismissed ? (
          <button
            onClick={onDismiss}
            disabled={loading}
            style={{
              flex: '2',
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
            {loading ? 'Dismissing...' : '✅ Dismiss Car'}
          </button>
        ) : (
          <div style={{
            flex: '2',
            padding: '0.75rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>
            ✅ Already Dismissed
          </div>
        )}
      </div>

      {/* Timing Information */}
      {car.arrivedAt && (
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#666',
          textAlign: 'center'
        }}>
          {isAlreadyDismissed ? 'Dismissed' : 'Arrived'} at{' '}
          {car.arrivedAt.toDate ? car.arrivedAt.toDate().toLocaleTimeString() : 'Unknown time'}
        </div>
      )}
    </div>
  );
};

export default CarDisplay;