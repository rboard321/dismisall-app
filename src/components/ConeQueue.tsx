import React, { useState } from 'react';
import { Dismissal } from '../types';

interface ConeQueueProps {
  coneCount: number;
  dismissals: Dismissal[];
  getQueueForCone: (coneNumber: number) => Dismissal[];
  onSendToCone: (dismissalId: string) => Promise<void>;
  onCarLoaded: (dismissalId: string) => Promise<void>;
  getStudentNames: (dismissal: Dismissal) => string[];
}

const ConeQueue: React.FC<ConeQueueProps> = ({
  coneCount,
  dismissals,
  getQueueForCone,
  onSendToCone,
  onCarLoaded,
  getStudentNames
}) => {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleSendToCone = async (dismissalId: string) => {
    setLoadingStates(prev => ({ ...prev, [dismissalId]: true }));
    try {
      await onSendToCone(dismissalId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [dismissalId]: false }));
    }
  };

  const handleCarLoaded = async (dismissalId: string) => {
    setLoadingStates(prev => ({ ...prev, [dismissalId]: true }));
    try {
      await onCarLoaded(dismissalId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [dismissalId]: false }));
    }
  };

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

  const getCarsByStatus = (coneNumber: number, status: string): Dismissal[] => {
    return dismissals.filter(d => d.coneNumber === coneNumber && d.status === status);
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

            {/* 3-Stage Workflow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* WAITING Section */}
              {getCarsByStatus(coneNumber, 'waiting').length > 0 && (
                <div>
                  <h5 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#856404',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    ⏳ WAITING QUEUE
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getCarsByStatus(coneNumber, 'waiting')
                      .sort((a, b) => a.dismissedAt.seconds - b.dismissedAt.seconds)
                      .map((dismissal) => (
                        <div key={dismissal.id} style={{
                          padding: '0.75rem',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                🚗 Car {dismissal.carNumber}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                                <strong>Students:</strong> {getStudentNames(dismissal).join(', ')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleSendToCone(dismissal.id)}
                              disabled={loadingStates[dismissal.id]}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: loadingStates[dismissal.id] ? 'not-allowed' : 'pointer',
                                opacity: loadingStates[dismissal.id] ? 0.6 : 1
                              }}
                            >
                              {loadingStates[dismissal.id] ? '⏳' : '▶️ Send to Cone'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* AT CONE Section */}
              {getCarsByStatus(coneNumber, 'at_cone').length > 0 && (
                <div>
                  <h5 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#0c5460',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    🚗 AT CONE
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getCarsByStatus(coneNumber, 'at_cone')
                      .sort((a, b) => a.dismissedAt.seconds - b.dismissedAt.seconds)
                      .map((dismissal) => (
                        <div key={dismissal.id} style={{
                          padding: '0.75rem',
                          backgroundColor: '#d1ecf1',
                          border: '1px solid #bee5eb',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                🚗 Car {dismissal.carNumber}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                                <strong>Students:</strong> {getStudentNames(dismissal).join(', ')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCarLoaded(dismissal.id)}
                              disabled={loadingStates[dismissal.id]}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: loadingStates[dismissal.id] ? 'not-allowed' : 'pointer',
                                opacity: loadingStates[dismissal.id] ? 0.6 : 1
                              }}
                            >
                              {loadingStates[dismissal.id] ? '⏳' : '✅ Car Loaded'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* DISMISSED Section - Only show recent dismissals */}
              {getCarsByStatus(coneNumber, 'dismissed').length > 0 && (
                <div>
                  <h5 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#155724',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    ✅ RECENTLY DISMISSED
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getCarsByStatus(coneNumber, 'dismissed')
                      .sort((a, b) => b.dismissedAt.seconds - a.dismissedAt.seconds)
                      .slice(0, 3)
                      .map((dismissal) => (
                        <div key={dismissal.id} style={{
                          padding: '0.75rem',
                          backgroundColor: '#d4edda',
                          border: '1px solid #c3e6cb',
                          borderRadius: '6px',
                          opacity: 0.8
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                🚗 Car {dismissal.carNumber}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                <strong>Students:</strong> {getStudentNames(dismissal).join(', ')}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#155724',
                              fontWeight: 'bold'
                            }}>
                              ✅ DONE
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {coneQueue.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: '#666',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px dashed #dee2e6'
                }}>
                  No cars assigned to this cone yet
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