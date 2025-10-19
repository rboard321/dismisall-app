import React from 'react';
import { Dismissal } from '../types';

interface ConeQueueProps {
  coneCount: number;
  dismissals: Dismissal[];
  getQueueForCone: (coneNumber: number) => Dismissal[];
}

const ConeQueue: React.FC<ConeQueueProps> = ({ coneCount, dismissals, getQueueForCone }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'waiting': return '#ffc107';
      case 'at_cone': return '#17a2b8';
      case 'dismissed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'at_cone': return '🚗';
      case 'dismissed': return '✅';
      default: return '❓';
    }
  };

  const getAllCarsForCone = (coneNumber: number): Dismissal[] => {
    return dismissals.filter(d => d.coneNumber === coneNumber);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(coneCount, 2)}, 1fr)`,
      gap: '1rem'
    }}>
      {Array.from({ length: coneCount }, (_, index) => {
        const coneNumber = index + 1;
        const coneQueue = getAllCarsForCone(coneNumber);
        const waitingCount = coneQueue.filter(d => d.status === 'waiting').length;
        const atConeCount = coneQueue.filter(d => d.status === 'at_cone').length;
        const dismissedCount = coneQueue.filter(d => d.status === 'dismissed').length;

        return (
          <div
            key={coneNumber}
            style={{
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1rem'
            }}
          >
            {/* Cone Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #eee'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '1.125rem',
                color: '#333'
              }}>
                🔴 Cone {coneNumber}
              </h4>
              <div style={{
                fontSize: '0.875rem',
                color: '#666'
              }}>
                {coneQueue.length} cars
              </div>
            </div>

            {/* Status Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#856404' }}>
                  {waitingCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#856404' }}>
                  Waiting
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: '#d1ecf1',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0c5460' }}>
                  {atConeCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0c5460' }}>
                  At Cone
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#155724' }}>
                  {dismissedCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#155724' }}>
                  Done
                </div>
              </div>
            </div>

            {/* Car Queue */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {coneQueue.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  color: '#666',
                  fontSize: '0.875rem'
                }}>
                  No cars assigned
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {coneQueue
                    .sort((a, b) => a.dismissedAt.seconds - b.dismissedAt.seconds)
                    .map((dismissal) => (
                      <div
                        key={dismissal.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          backgroundColor: dismissal.status === 'dismissed' ? '#f8f9fa' : 'white',
                          border: `1px solid ${getStatusColor(dismissal.status)}`,
                          borderRadius: '4px',
                          opacity: dismissal.status === 'dismissed' ? 0.6 : 1
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>
                            {getStatusIcon(dismissal.status)}
                          </span>
                          <div>
                            <div style={{
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              textDecoration: dismissal.status === 'dismissed' ? 'line-through' : 'none'
                            }}>
                              Car {dismissal.carNumber}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#666'
                            }}>
                              {dismissal.studentIds.length} student{dismissal.studentIds.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          color: getStatusColor(dismissal.status),
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {dismissal.status.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConeQueue;