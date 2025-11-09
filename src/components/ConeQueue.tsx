import React, { useState, useEffect, useRef } from 'react';
import { Dismissal, School } from '../types';
import { useAnimations } from '../utils/feedback';

interface ConeQueueProps {
  coneCount: number;
  dismissals: Dismissal[];
  getQueueForCone: (coneNumber: number) => Dismissal[];
  onSendStudents: (dismissalId: string) => Promise<void>;
  onMarkCompleted: (dismissalId: string) => Promise<void>;
  getStudentNames: (dismissal: Dismissal) => string[];
  schoolProfile: School | null;
}

const ConeQueue: React.FC<ConeQueueProps> = ({
  coneCount,
  dismissals,
  getQueueForCone,
  onSendStudents,
  onMarkCompleted,
  getStudentNames,
  schoolProfile
}) => {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [showHistory, setShowHistory] = useState<{ [key: number]: boolean }>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { haptic, animate, celebrate, loading } = useAnimations();

  const handleSendStudents = async (dismissalId: string) => {
    setLoadingStates(prev => ({ ...prev, [dismissalId]: true }));
    try {
      await onSendStudents(dismissalId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [dismissalId]: false }));
    }
  };

  const handleMarkCompleted = async (dismissalId: string) => {
    setLoadingStates(prev => ({ ...prev, [dismissalId]: true }));
    try {
      await onMarkCompleted(dismissalId);
    } finally {
      setLoadingStates(prev => ({ ...prev, [dismissalId]: false }));
    }
  };

  // Get cars by status for a specific cone
  const getCarsByStatus = (coneNumber: number, status: string): Dismissal[] => {
    return dismissals.filter(d => d.coneNumber === coneNumber && d.status === status)
      .sort((a, b) => a.dismissedAt.seconds - b.dismissedAt.seconds);
  };

  // Get next 3 queued cars for display
  const getNextQueuedCars = (coneNumber: number): Dismissal[] => {
    return getCarsByStatus(coneNumber, 'queued').slice(0, 3);
  };

  // Get currently sent cars
  const getCurrentlySent = (coneNumber: number): Dismissal[] => {
    return getCarsByStatus(coneNumber, 'sent');
  };

  // Get recently completed cars for history
  const getRecentlyCompleted = (coneNumber: number): Dismissal[] => {
    return getCarsByStatus(coneNumber, 'completed')
      .sort((a, b) => b.dismissedAt.seconds - a.dismissedAt.seconds)
      .slice(0, 10);
  };

  const toggleHistory = (coneNumber: number) => {
    setShowHistory(prev => ({ ...prev, [coneNumber]: !prev[coneNumber] }));
  };

  // Update current time every second for countdown display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time until auto-clear
  const getRemainingTime = (dismissal: Dismissal): string | null => {
    if (!schoolProfile?.settings?.autoClearEnabled || !dismissal.sentAt) {
      return null;
    }

    const autoClearDelayMs = (schoolProfile.settings.autoClearDelayMinutes || 2) * 60 * 1000;
    const sentAt = (dismissal.sentAt as any).toDate ? (dismissal.sentAt as any).toDate() : new Date((dismissal.sentAt as any).seconds * 1000);
    const timeSinceSent = currentTime.getTime() - sentAt.getTime();
    const remainingMs = autoClearDelayMs - timeSinceSent;

    if (remainingMs <= 0) {
      return 'Auto-clearing...';
    }

    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={`grid gap-md ${coneCount > 2 ? 'grid-auto-fit-md' : 'grid-2-mobile-1'}`}>
      {Array.from({ length: coneCount }, (_, index) => {
        const coneNumber = index + 1;
        const nextCars = getNextQueuedCars(coneNumber);
        const sentCars = getCurrentlySent(coneNumber);
        const completedCars = getRecentlyCompleted(coneNumber);
        const totalQueuedCount = getCarsByStatus(coneNumber, 'queued').length;

        return (
          <div key={coneNumber} className="card">
            {/* Cone Header */}
            <div className="card-header flex justify-between items-center">
              <h4 className="text-lg font-semibold m-0">
                🔴 Cone {coneNumber}
              </h4>
              <div className="text-sm text-muted">
                {totalQueuedCount} queued
              </div>
            </div>

            <div className="card-body">
              {/* Next Students Section - Show only next 3 */}
              {nextCars.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{
                    margin: '0 0 1rem 0',
                    color: '#004085',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📋 Next Students ({Math.min(nextCars.length, 3)})
                    {totalQueuedCount > 3 && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px'
                      }}>
                        +{totalQueuedCount - 3} more
                      </span>
                    )}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {nextCars.map((dismissal) => (
                      <div key={dismissal.id} style={{
                        padding: '1rem',
                        backgroundColor: '#e7f3ff',
                        border: '1px solid #b3d9ff',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>
                              🚗 Car {dismissal.carNumber}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                              {getStudentNames(dismissal).join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendStudents(dismissal.id)}
                            disabled={loadingStates[dismissal.id]}
                            style={{
                              padding: '0.75rem 1.5rem',
                              backgroundColor: loadingStates[dismissal.id] ? '#ccc' : '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: loadingStates[dismissal.id] ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              minWidth: '140px'
                            }}
                          >
                            {loadingStates[dismissal.id] ? '⏳ Sending...' : '▶️ Send Students'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently Loading Section */}
              {sentCars.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{
                    margin: '0 0 1rem 0',
                    color: '#856404',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    🚶‍♂️ Currently Loading
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sentCars.map((dismissal) => {
                      const remainingTime = getRemainingTime(dismissal);
                      return (
                        <div key={dismissal.id} style={{
                          padding: '1rem',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                🚗 Car {dismissal.carNumber}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                                {getStudentNames(dismissal).join(', ')}
                              </div>
                              {remainingTime && (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: remainingTime === 'Auto-clearing...' ? '#dc3545' : '#856404',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  ⏱️ {remainingTime === 'Auto-clearing...' ? remainingTime : `Auto-clearing in ${remainingTime}`}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleMarkCompleted(dismissal.id)}
                              disabled={loadingStates[dismissal.id]}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: loadingStates[dismissal.id] ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: loadingStates[dismissal.id] ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {loadingStates[dismissal.id] ? '⏳' : '✅ Done Now'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History Section - Collapsible */}
              {completedCars.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHistory(coneNumber)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    📊 View Recent History ({completedCars.length})
                    <span>{showHistory[coneNumber] ? '▲' : '▼'}</span>
                  </button>

                  {showHistory[coneNumber] && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {completedCars.map((dismissal) => (
                          <div key={dismissal.id} style={{
                            padding: '0.75rem',
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '6px',
                            opacity: 0.9
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                  🚗 Car {dismissal.carNumber}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                  {getStudentNames(dismissal).join(', ')}
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
                </div>
              )}

              {/* Empty State */}
              {nextCars.length === 0 && sentCars.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#666',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px dashed #dee2e6'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                  <div>No cars assigned to this cone yet</div>
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