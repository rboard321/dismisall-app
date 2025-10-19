import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { User, Student, Dismissal, Lane, DismissalSummary, UserRole } from '../types';
import ConeConfiguration from '../components/ConeConfiguration';
import UserManagement from '../components/UserManagement';
import DismissalReports from '../components/DismissalReports';
import InvitationManagement from '../components/InvitationManagement';
import SubscriptionManagement from '../components/SubscriptionManagement';

const AdminPage: React.FC = () => {
  const { userProfile, schoolProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'users' | 'invitations' | 'billing' | 'reports'>('daily');
  const [todaysLane, setTodaysLane] = useState<Lane | null>(null);
  const [todaysDismissals, setTodaysDismissals] = useState<Dismissal[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load today's dismissals
  const loadTodaysDismissals = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dismissalsCollection = collection(db, 'schools', userProfile.schoolId, 'dismissals');
      const q = query(
        dismissalsCollection,
        where('dismissedAt', '>=', Timestamp.fromDate(today)),
        where('dismissedAt', '<', Timestamp.fromDate(tomorrow)),
        orderBy('dismissedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const dismissalsData: Dismissal[] = [];
      snapshot.forEach((doc) => {
        dismissalsData.push({ id: doc.id, ...doc.data() } as Dismissal);
      });

      setTodaysDismissals(dismissalsData);
    } catch (error) {
      console.error('Error loading today\'s dismissals:', error);
    }
  }, [userProfile?.schoolId]);

  // Load students for reporting
  const loadStudents = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      const studentsCollection = collection(db, 'schools', userProfile.schoolId, 'students');
      const q = query(studentsCollection, orderBy('lastName'), orderBy('firstName'));
      const snapshot = await getDocs(q);

      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, [userProfile?.schoolId]);

  // Load users for management
  const loadUsers = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('schoolId', '==', userProfile.schoolId));
      const snapshot = await getDocs(q);

      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() } as User);
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [userProfile?.schoolId]);

  // Reload school data (for subscription updates)
  const reloadSchoolData = useCallback(async () => {
    // This would trigger a reload of the school profile in the AuthContext
    // For now, we'll just reload the page data
    window.location.reload();
  }, []);

  useEffect(() => {
    loadTodaysLane();
    loadTodaysDismissals();
    loadStudents();
    loadUsers();
  }, [loadTodaysLane, loadTodaysDismissals, loadStudents, loadUsers]);

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

  // Reset dismissal data for today
  const handleResetDismissalData = async () => {
    if (!userProfile?.schoolId) return;
    if (!window.confirm('Are you sure you want to reset all dismissal data for today? This action cannot be undone.')) return;

    setLoading(true);
    try {
      // Delete all dismissals for today
      for (const dismissal of todaysDismissals) {
        const dismissalDoc = doc(db, 'schools', userProfile.schoolId, 'dismissals', dismissal.id);
        await deleteDoc(dismissalDoc);
      }

      // Reset lane pointer to 1
      if (todaysLane) {
        const laneDoc = doc(db, 'schools', userProfile.schoolId, 'lanes', todaysLane.id);
        await updateDoc(laneDoc, {
          currentPointer: 1,
          updatedAt: Timestamp.now()
        });
      }

      await loadTodaysLane();
      await loadTodaysDismissals();
      alert('Dismissal data reset successfully!');
    } catch (error) {
      console.error('Error resetting dismissal data:', error);
      alert('Failed to reset dismissal data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleUserRoleUpdate = async (uid: string, newRole: UserRole) => {
    if (!userProfile?.schoolId) return;

    setLoading(true);
    try {
      const userDoc = doc(db, 'users', uid);
      await updateDoc(userDoc, {
        role: newRole
      });

      await loadUsers();
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate dismissal summary
  const getDismissalSummary = (): DismissalSummary => {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = todaysDismissals.reduce((sum, d) => sum + d.studentIds.length, 0);
    const totalCars = todaysDismissals.length;

    // Calculate cone utilization
    const coneUtilization: { [coneNumber: number]: number } = {};
    const coneCount = todaysLane?.coneCount || 4;

    for (let i = 1; i <= coneCount; i++) {
      coneUtilization[i] = todaysDismissals.filter(d => d.coneNumber === i).length;
    }

    // Calculate average dismissal time (placeholder)
    const averageDismissalTime = todaysDismissals.length > 0 ? 3.5 : 0; // minutes

    return {
      date: today,
      totalStudents,
      totalCars,
      averageDismissalTime,
      coneUtilization
    };
  };

  const dismissalSummary = getDismissalSummary();

  const tabs = [
    { id: 'daily', label: 'Daily Management', icon: '📋' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'invitations', label: 'Invitations', icon: '✉️' },
    { id: 'billing', label: 'Billing & Subscription', icon: '💳' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' }
  ] as const;

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
        <h1>Admin Panel</h1>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          School: {userProfile.schoolId}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dee2e6',
        marginBottom: '2rem',
        gap: '0.5rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'daily' && (
        <div>
          <h2>Daily Management</h2>

          {/* Today's Summary */}
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
                {dismissalSummary.totalCars}
              </div>
              <div style={{ color: '#155724' }}>Cars Dismissed</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#cce5ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#004085' }}>
                {dismissalSummary.totalStudents}
              </div>
              <div style={{ color: '#004085' }}>Students Dismissed</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#856404' }}>
                {todaysLane?.coneCount || 0}
              </div>
              <div style={{ color: '#856404' }}>Active Cones</div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Cone Configuration */}
            <ConeConfiguration
              currentConeCount={todaysLane?.coneCount || 4}
              onUpdate={handleConeCountUpdate}
              loading={loading}
            />

            {/* Reset Controls */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Daily Reset</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Reset all dismissal data for today. This will clear all car dismissals
                and reset the cone assignment pointer.
              </p>
              <button
                onClick={handleResetDismissalData}
                disabled={loading || todaysDismissals.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading || todaysDismissals.length === 0 ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || todaysDismissals.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Resetting...' : 'Reset Today\'s Data'}
              </button>
              {todaysDismissals.length === 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                  No dismissal data to reset
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2>User Management</h2>
          <UserManagement
            users={users}
            onRoleUpdate={handleUserRoleUpdate}
            loading={loading}
          />
        </div>
      )}

      {activeTab === 'invitations' && (
        <div>
          <h2>Invitation Management</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Invite new team members to join your school. They'll receive an invitation link to sign up and will be automatically assigned to your school with the specified role.
          </p>
          <InvitationManagement
            schoolId={userProfile.schoolId}
            currentUserUid={userProfile.uid}
          />
        </div>
      )}

      {activeTab === 'billing' && (
        <div>
          <h2>Billing & Subscription</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Manage your subscription, billing information, and payment settings. Upgrade or downgrade your plan at any time.
          </p>
          {schoolProfile ? (
            <SubscriptionManagement
              school={schoolProfile}
              onSchoolUpdate={reloadSchoolData}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <h3>Loading subscription information...</h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h2>Reports & Analytics</h2>
          <DismissalReports
            dismissalSummary={dismissalSummary}
            dismissals={todaysDismissals}
            students={students}
            schoolId={userProfile.schoolId}
          />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
