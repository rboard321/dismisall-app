import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Student, Override, Dismissal, Lane } from '../types';
import ConeQueue from '../components/ConeQueue';

const DashboardPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [todaysLane, setTodaysLane] = useState<Lane | null>(null);
  const [dismissals, setDismissals] = useState<Dismissal[]>([]);
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
          coneCount: 4, // Default to 4 cones
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dismissalData: Dismissal[] = [];
      snapshot.forEach((doc) => {
        const dismissal = { id: doc.id, ...doc.data() } as Dismissal;
        // Only include active dismissals (exclude historical ones)
        if (dismissal.status !== 'historical') {
          dismissalData.push(dismissal);
        }
      });
      setDismissals(dismissalData);
    });

    return () => unsubscribe();
  }, [userProfile?.schoolId]);

  useEffect(() => {
    loadTodaysLane();
  }, [loadTodaysLane]);


  const getQueueForCone = (coneNumber: number): Dismissal[] => {
    return dismissals.filter(d =>
      d.coneNumber === coneNumber &&
      d.status !== 'dismissed' &&
      d.status !== 'historical'
    );
  };

  if (!userProfile) return null;

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>Dismissal Management</h1>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {todaysLane && (
            <div>
              <strong>Cones:</strong> {todaysLane.coneCount} |
              <strong> Next:</strong> Cone {todaysLane.currentPointer}
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

      {/* Cone Queue Section */}
      {todaysLane && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Cone Queues</h2>
          <ConeQueue
            coneCount={todaysLane.coneCount}
            dismissals={dismissals}
            getQueueForCone={getQueueForCone}
          />
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
            {dismissals.filter(d => d.status === 'dismissed').length}
          </div>
          <div style={{ color: '#155724' }}>Cars Dismissed</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
            {dismissals.filter(d => d.status === 'at_cone').length}
          </div>
          <div style={{ color: '#856404' }}>At Cones</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#cce5ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>
            {dismissals.filter(d => d.status === 'waiting').length}
          </div>
          <div style={{ color: '#004085' }}>Waiting</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
