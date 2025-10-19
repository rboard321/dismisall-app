import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Student, Override, Lane } from '../types';
import CarInput from '../components/CarInput';

interface CarLookupResult {
  carNumber: string;
  students: {
    id: string;
    displayName: string;
    grade: string;
    isOverride: boolean;
  }[];
  coneNumber: number;
  status: 'success' | 'no_students' | 'already_dismissed';
  timestamp: Date;
}

const CarLookupPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [todaysDismissals, setTodaysDismissals] = useState<Dismissal[]>([]);
  const [todaysLane, setTodaysLane] = useState<Lane | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load today's lane configuration
  const loadTodaysLane = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lanesCollection = collection(db, 'schools', userProfile.schoolId, 'lanes');
      const q = query(lanesCollection, where('date', '==', today));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const laneDoc = snapshot.docs[0];
        setTodaysLane({ id: laneDoc.id, ...laneDoc.data() } as Lane);
      } else {
        // Create today's lane with default settings
        const newLane: Omit<Lane, 'id'> = {
          date: today,
          coneCount: 4,
          currentPointer: 1,
          timezone: 'America/New_York',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(lanesCollection, newLane);
        setTodaysLane({ id: docRef.id, ...newLane });
      }
    } catch (error) {
      console.error('Error loading today\'s lane:', error);
      setError('Failed to load dismissal configuration');
    }
  }, [userProfile?.schoolId]);

  useEffect(() => {
    loadTodaysLane();
  }, [loadTodaysLane]);

  // Subscribe to real-time dismissal updates
  useEffect(() => {
    if (!userProfile?.schoolId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dismissalsCollection = collection(db, 'schools', userProfile.schoolId, 'dismissals');
    const q = query(
      dismissalsCollection,
      where('dismissedAt', '>=', Timestamp.fromDate(today)),
      where('dismissedAt', '<', Timestamp.fromDate(tomorrow))
    );

    // Listen for dismissal changes with optimized server-side filtering
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todaysData: Dismissal[] = [];

      snapshot.forEach((doc) => {
        const dismissal = { id: doc.id, ...doc.data() } as Dismissal;
        // Only include non-historical dismissals (date already filtered server-side)
        if (dismissal.status !== 'historical') {
          todaysData.push(dismissal);
        }
      });

      setTodaysDismissals(todaysData);
    });

    return () => unsubscribe();
  }, [userProfile?.schoolId]);

  // Find car with students and assign cone
  const handleCarLookup = async (carNumber: string) => {
    if (!userProfile?.schoolId || !carNumber.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const schoolId = userProfile.schoolId;

      // Get students assigned to this car (either as default or override)
      const studentsCollection = collection(db, 'schools', schoolId, 'students');
      const studentsSnapshot = await getDocs(studentsCollection);

      const students: Student[] = [];
      studentsSnapshot.forEach((doc) => {
        const student = { id: doc.id, ...doc.data() } as Student;
        if (student.defaultCarNumber === carNumber) {
          students.push(student);
        }
      });

      // Get active overrides for this car
      const overridesCollection = collection(db, 'schools', schoolId, 'overrides');
      const today = new Date();
      const overridesQuery = query(
        overridesCollection,
        where('carNumber', '==', carNumber)
      );
      const overridesSnapshot = await getDocs(overridesQuery);

      const overrideStudentIds: string[] = [];

      overridesSnapshot.forEach((doc) => {
        const override = { id: doc.id, ...doc.data() } as Override;

        // Filter client-side for active overrides that are still valid
        const endDate = override.endDate.toDate ? override.endDate.toDate() : new Date(override.endDate as any);
        const isActive = override.isActive && endDate >= today;

        if (isActive) {
          overrideStudentIds.push(override.studentId);
        }
      });

      // Get override students
      if (overrideStudentIds.length > 0) {
        const overrideStudentsSnapshot = await getDocs(studentsCollection);
        overrideStudentsSnapshot.forEach((doc) => {
          const student = { id: doc.id, ...doc.data() } as Student;
          if (overrideStudentIds.includes(student.id)) {
            students.push(student);
          }
        });
      }

      if (students.length === 0) {
        setError(`No students found for car ${carNumber}`);
        return;
      }

      // Check if car is already dismissed today (simplified query to avoid index requirement)
      const dismissalsCollection = collection(db, 'schools', schoolId, 'dismissals');
      const dismissalQuery = query(
        dismissalsCollection,
        where('carNumber', '==', carNumber)
      );
      const dismissalSnapshot = await getDocs(dismissalQuery);

      // Check client-side if any dismissal is from today
      const today_start = new Date();
      today_start.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today_start);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let todaysDismissal: any = null;
      dismissalSnapshot.forEach((doc) => {
        const dismissal = doc.data();
        const dismissedAt = dismissal.dismissedAt.toDate ? dismissal.dismissedAt.toDate() : new Date(dismissal.dismissedAt as any);

        // Only consider non-historical dismissals from today
        if (dismissedAt >= today_start && dismissedAt < tomorrow && dismissal.status !== 'historical') {
          todaysDismissal = dismissal;
        }
      });

      if (todaysDismissal) {
        setError(`Car ${carNumber} is already processed today (Cone ${todaysDismissal.coneNumber})`);
        return;
      }

      // Assign cone if not already dismissed
      let coneNumber = 0;
      if (todaysLane) {
        coneNumber = todaysLane.currentPointer;

        // Update lane pointer for round-robin
        const nextPointer = (todaysLane.currentPointer % todaysLane.coneCount) + 1;
        const laneDoc = doc(db, 'schools', schoolId, 'lanes', todaysLane.id);
        await updateDoc(laneDoc, {
          currentPointer: nextPointer,
          updatedAt: Timestamp.now()
        });

        setTodaysLane(prev => prev ? { ...prev, currentPointer: nextPointer } : null);

        // Record the car assignment to Firestore with waiting status
        await addDoc(dismissalsCollection, {
          carNumber,
          studentIds: students.map(s => s.id),
          coneNumber,
          dismissedBy: userProfile.uid,
          dismissedAt: Timestamp.now(),
          status: 'waiting'
        });

        // Clear error and show success
        setError(null);
        // The real-time subscription will automatically update the display
      }

    } catch (error) {
      console.error('Error looking up car:', error);
      setError('Failed to lookup car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCar = async (dismissalId: string) => {
    if (!userProfile?.schoolId) return;

    if (window.confirm('Remove this car from the queue?')) {
      try {
        const dismissalDoc = doc(db, 'schools', userProfile.schoolId, 'dismissals', dismissalId);
        await updateDoc(dismissalDoc, {
          status: 'historical',
          resetAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error removing car:', error);
        setError('Failed to remove car. Please try again.');
      }
    }
  };

  const handleClearAll = async () => {
    if (!userProfile?.schoolId) return;

    if (window.confirm('Clear all cars from the queue?')) {
      try {
        const waitingCars = todaysDismissals.filter(d => d.status === 'waiting');
        const updatePromises = waitingCars.map(dismissal => {
          const dismissalDoc = doc(db, 'schools', userProfile.schoolId!, 'dismissals', dismissal.id);
          return updateDoc(dismissalDoc, {
            status: 'historical',
            resetAt: Timestamp.now()
          });
        });

        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error clearing cars:', error);
        setError('Failed to clear cars. Please try again.');
      }
    }
  };

  if (!userProfile) return null;

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>Car Lookup</h1>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {todaysLane && (
            <div>
              <strong>Next Cone:</strong> {todaysLane.currentPointer}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Car Input */}
      <CarInput
        onCarSubmit={handleCarLookup}
        loading={loading}
        disabled={loading}
      />

      {/* Today's Queue */}
      {todaysDismissals.filter(d => d.status === 'waiting').length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0 }}>
              Today's Queue ({todaysDismissals.filter(d => d.status === 'waiting').length})
            </h3>
            <button
              onClick={handleClearAll}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear All
            </button>
          </div>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {todaysDismissals
              .filter(dismissal => dismissal.status === 'waiting')
              .map((dismissal) => (
              <div
                key={dismissal.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.25rem' }}>
                      Car {dismissal.carNumber}
                    </h4>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      → Cone {dismissal.coneNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCar(dismissal.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {dismissal.studentIds.length} student{dismissal.studentIds.length !== 1 ? 's' : ''} assigned
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#004085'
      }}>
        <strong>📝 How to use:</strong>
        <ol style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>Enter car numbers one by one - each car gets added to the queue below</li>
          <li>Cars are automatically assigned cone numbers</li>
          <li>Queue persists when navigating between pages</li>
          <li>Cars disappear when processed at the Management page</li>
          <li>Use "Clear All" or individual "✕" buttons to remove cars manually</li>
        </ol>
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <strong>💡 Tip:</strong> The queue is shared in real-time across all devices and pages!
        </div>
      </div>
    </div>
  );
};

export default CarLookupPage;