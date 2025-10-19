import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Lane } from '../types';
import ConeConfiguration from '../components/ConeConfiguration';

const TeacherSetupPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [todaysLane, setTodaysLane] = useState<Lane | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
        setTodaysLane(null);
      }
    } catch (error) {
      console.error('Error loading today\'s lane:', error);
    }
  }, [userProfile?.schoolId]);

  useEffect(() => {
    loadTodaysLane();
  }, [loadTodaysLane]);

  // Update cone count for today
  const handleConeCountUpdate = async (coneCount: number) => {
    if (!userProfile?.schoolId) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (todaysLane) {
        // Update existing lane
        const laneDoc = doc(db, 'schools', userProfile.schoolId, 'lanes', todaysLane.id);
        await updateDoc(laneDoc, {
          coneCount,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new lane for today
        const newLane: Omit<Lane, 'id'> = {
          date: today,
          coneCount,
          currentPointer: 1,
          timezone: 'America/New_York',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        const lanesCollection = collection(db, 'schools', userProfile.schoolId, 'lanes');
        await addDoc(lanesCollection, newLane);
      }

      await loadTodaysLane();
      alert('Cone count updated successfully!');
    } catch (error) {
      console.error('Error updating cone count:', error);
      alert('Failed to update cone count. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset day - clear today's dismissals and reset lane pointer
  const handleDayReset = async () => {
    if (!userProfile?.schoolId) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset today\'s dismissals? This will:\n\n' +
      '• Clear all cars from today\'s dismissal queue\n' +
      '• Reset the cone pointer to 1\n' +
      '• Keep historical records for reporting\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    setResetLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's dismissals
      const dismissalsCollection = collection(db, 'schools', userProfile.schoolId, 'dismissals');
      const dismissalsSnapshot = await getDocs(dismissalsCollection);

      // Use batch to update all today's dismissals to historical status
      const batch = writeBatch(db);

      dismissalsSnapshot.forEach((docSnapshot) => {
        const dismissal = docSnapshot.data();
        const dismissedAt = dismissal.dismissedAt.toDate ? dismissal.dismissedAt.toDate() : new Date(dismissal.dismissedAt as any);

        // If dismissal is from today, mark it as historical
        if (dismissedAt >= today && dismissedAt < tomorrow) {
          const dismissalRef = doc(db, 'schools', userProfile.schoolId!, 'dismissals', docSnapshot.id);
          batch.update(dismissalRef, {
            status: 'historical',
            resetAt: Timestamp.now()
          });
        }
      });

      // Reset lane pointer to 1
      if (todaysLane) {
        const laneDoc = doc(db, 'schools', userProfile.schoolId, 'lanes', todaysLane.id);
        batch.update(laneDoc, {
          currentPointer: 1,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();
      await loadTodaysLane();

      alert('Day reset successfully! Ready for new dismissals.');
    } catch (error) {
      console.error('Error resetting day:', error);
      alert('Failed to reset day. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '2rem'
      }}>
        <h1>Daily Setup</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Configure your dismissal settings for today.
        </p>
      </div>

      {/* Current Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#155724' }}>
            {todaysLane?.coneCount || 0}
          </div>
          <div style={{ color: '#155724' }}>Active Cones</div>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#cce5ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#004085' }}>
            {todaysLane?.currentPointer || 1}
          </div>
          <div style={{ color: '#004085' }}>Next Cone</div>
        </div>
      </div>

      {/* Cone Configuration */}
      <ConeConfiguration
        currentConeCount={todaysLane?.coneCount || 4}
        onUpdate={handleConeCountUpdate}
        loading={loading}
      />

      {/* Day Reset Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#856404' }}>
          🔄 Daily Reset
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: '#856404' }}>
          Use this at the end of the day to clear today's dismissals and prepare for tomorrow.
          All data will be preserved for historical tracking.
        </p>
        <button
          onClick={handleDayReset}
          disabled={resetLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: resetLoading ? '#ccc' : '#ffc107',
            color: resetLoading ? '#666' : '#212529',
            border: 'none',
            borderRadius: '4px',
            cursor: resetLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {resetLoading ? 'Resetting...' : '🗑️ Reset Today\'s Dismissals'}
        </button>
      </div>

      {/* Quick Tips */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Quick Setup Tips</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
          <li><strong>Cone Count:</strong> Set this based on your school's pickup layout</li>
          <li><strong>Daily Reset:</strong> Configuration applies to today's dismissal only</li>
          <li><strong>Car Assignment:</strong> Use the Students page to assign cars to students</li>
          <li><strong>Dashboard:</strong> Use the Dashboard to process dismissals</li>
        </ul>
      </div>
    </div>
  );
};

export default TeacherSetupPage;