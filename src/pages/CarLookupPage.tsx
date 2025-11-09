import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Student, Override, Lane, Dismissal } from '../types';
import CarInput from '../components/CarInput';
import '../styles/CarLookup.css';

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
  const [laneCreationAttempted, setLaneCreationAttempted] = useState(false);


  // Subscribe to real-time lane updates
  useEffect(() => {
    if (!userProfile?.schoolId) return;

    const today = new Date().toISOString().split('T')[0];
    const lanesCollection = collection(db, 'schools', userProfile.schoolId, 'lanes');
    const q = query(lanesCollection, where('date', '==', today));

    console.log('Setting up real-time listener for today\'s lane...');

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Lane data updated, found', snapshot.size, 'lanes');

      if (!snapshot.empty) {
        const laneDoc = snapshot.docs[0];
        const laneData = { id: laneDoc.id, ...laneDoc.data() } as Lane;
        console.log('Updated lane data:', laneData);
        setTodaysLane(laneData);
        // Reset creation attempt flag when lane is found
        setLaneCreationAttempted(false);
      } else if (!laneCreationAttempted) {
        // Create today's lane with default settings if it doesn't exist
        console.log('No lane found for today, creating new lane...');
        setLaneCreationAttempted(true);
        try {
          const newLane: Omit<Lane, 'id'> = {
            date: today,
            coneCount: 4,
            currentPointer: 1,
            timezone: 'America/New_York',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          const docRef = await addDoc(lanesCollection, newLane);
          console.log('Created new lane with ID:', docRef.id);
          // Don't set the lane here - let the snapshot listener handle it
        } catch (error) {
          console.error('Error creating today\'s lane:', error);
          setError('Failed to create dismissal configuration. Please contact your administrator.');
          setLaneCreationAttempted(false); // Allow retry on error
        }
      }
    }, (error) => {
      console.error('Error in lane listener:', error);
      setError('Failed to load dismissal configuration');
    });

    return () => {
      console.log('Cleaning up lane listener');
      unsubscribe();
    };
  }, [userProfile?.schoolId, laneCreationAttempted]); // Include laneCreationAttempted in dependencies

  // Reset lane creation attempt when schoolId changes
  useEffect(() => {
    setLaneCreationAttempted(false);
  }, [userProfile?.schoolId]);

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
  const handleCarLookup = useCallback(async (carNumber: string) => {
    if (!userProfile?.schoolId || !carNumber.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const schoolId = userProfile.schoolId;

      console.log('Car lookup debug info:');
      console.log('- User role:', userProfile.role);
      console.log('- User permissions:', userProfile.permissions);
      console.log('- School ID:', schoolId);
      console.log('- Car number:', carNumber);

      // Get students assigned to this car (either as default or override)
      console.log('Attempting to query students collection...');
      const studentsCollection = collection(db, 'schools', schoolId, 'students');
      const studentsSnapshot = await getDocs(studentsCollection);
      console.log('Students query successful, found', studentsSnapshot.size, 'students');

      const students: Student[] = [];
      studentsSnapshot.forEach((doc) => {
        const student = { id: doc.id, ...doc.data() } as Student;
        if (student.defaultCarNumber === carNumber) {
          students.push(student);
        }
      });

      // Get active overrides for this car
      console.log('Attempting to query overrides collection...');
      const overridesCollection = collection(db, 'schools', schoolId, 'overrides');
      const today = new Date();
      const overridesQuery = query(
        overridesCollection,
        where('carNumber', '==', carNumber)
      );
      const overridesSnapshot = await getDocs(overridesQuery);
      console.log('Overrides query successful, found', overridesSnapshot.size, 'overrides');

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
        console.log('Querying students collection again for override students...');
        const overrideStudentsSnapshot = await getDocs(studentsCollection);
        console.log('Override students query successful');
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
      console.log('Attempting to query dismissals collection...');
      const dismissalsCollection = collection(db, 'schools', schoolId, 'dismissals');
      const dismissalQuery = query(
        dismissalsCollection,
        where('carNumber', '==', carNumber)
      );
      const dismissalSnapshot = await getDocs(dismissalQuery);
      console.log('Dismissals query successful, found', dismissalSnapshot.size, 'dismissals');

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
        console.log('Attempting to update lane pointer...');
        const nextPointer = (todaysLane.currentPointer % todaysLane.coneCount) + 1;
        const laneDoc = doc(db, 'schools', schoolId, 'lanes', todaysLane.id);
        await updateDoc(laneDoc, {
          currentPointer: nextPointer,
          updatedAt: Timestamp.now()
        });
        console.log('Lane pointer update successful');

        setTodaysLane(prev => prev ? { ...prev, currentPointer: nextPointer } : null);

        // Record the car assignment to Firestore with queued status
        console.log('Attempting to create dismissal record...');
        await addDoc(dismissalsCollection, {
          carNumber,
          studentIds: students.map(s => s.id),
          coneNumber,
          dismissedBy: userProfile.uid,
          dismissedAt: Timestamp.now(),
          status: 'queued'
        });
        console.log('Dismissal record created successfully');

        // Clear error and show success
        setError(null);
        // The real-time subscription will automatically update the display
      }

    } catch (error) {
      console.error('Error looking up car:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      setError('Failed to lookup car. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.schoolId, userProfile?.uid, userProfile?.role, userProfile?.permissions, todaysLane]);

  const handleRemoveCar = useCallback(async (dismissalId: string) => {
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
  }, [userProfile?.schoolId]);

  const handleClearAll = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    if (window.confirm('Clear all cars from the queue?')) {
      try {
        const queuedCars = todaysDismissals.filter(d => d.status === 'queued');
        const updatePromises = queuedCars.map(dismissal => {
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
  }, [userProfile?.schoolId, todaysDismissals]);

  if (!userProfile) return null;

  // Debug: log user profile on render
  console.log('CarLookupPage render - userProfile:', {
    uid: userProfile.uid,
    role: userProfile.role,
    permissions: userProfile.permissions,
    schoolId: userProfile.schoolId
  });

  return (
    <div className="car-lookup-container">
      {/* Mobile-first header */}
      <div className="car-lookup-header">
        <h1 className="car-lookup-title">🚗 Car Lookup</h1>
        {todaysLane && (
          <div className="next-cone-indicator">
            <span className="cone-label">Next Cone:</span>
            <span className="cone-number">{todaysLane.currentPointer}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="car-lookup-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Car Input */}
      <CarInput
        onCarSubmit={handleCarLookup}
        loading={loading}
        disabled={loading}
      />

      {/* Today's Queue */}
      {todaysDismissals.filter(d => d.status === 'queued').length > 0 && (
        <div className="car-lookup-queue">
          <div className="queue-header">
            <h3 className="queue-title">
              📋 Queue ({todaysDismissals.filter(d => d.status === 'queued').length})
            </h3>
            <button
              onClick={handleClearAll}
              className="btn btn-danger clear-all-btn"
            >
              🗑️ Clear All
            </button>
          </div>

          <div className="queue-list">
            {todaysDismissals
              .filter(dismissal => dismissal.status === 'queued')
              .map((dismissal) => (
              <div
                key={dismissal.id}
                className="queue-car-card"
              >
                <div className="car-card-header">
                  <div className="car-info">
                    <h4 className="car-number">
                      🚗 Car {dismissal.carNumber}
                    </h4>
                    <span className="cone-assignment">
                      🔴 Cone {dismissal.coneNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCar(dismissal.id)}
                    className="btn btn-sm remove-car-btn"
                    title="Remove from queue"
                  >
                    ✕
                  </button>
                </div>

                <div className="student-count">
                  👥 {dismissal.studentIds.length} student{dismissal.studentIds.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions - Collapsible on mobile */}
      <div className="car-lookup-instructions">
        <div className="instructions-header">
          <span>📝 Quick Guide</span>
        </div>
        <div className="instructions-content">
          <div className="instruction-grid">
            <div className="instruction-item">
              <span className="instruction-icon">🔤</span>
              <span>Type car number</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🎤</span>
              <span>Use voice input</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">📱</span>
              <span>Scan QR code</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🔄</span>
              <span>Real-time sync</span>
            </div>
          </div>
          <div className="tip-banner">
            💡 Queue updates live across all devices!
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarLookupPage;