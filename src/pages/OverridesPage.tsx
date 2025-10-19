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
import { Override, Student, OverrideFormData } from '../types';
import OverrideForm from '../components/OverrideForm';
import OverrideList from '../components/OverrideList';

const OverridesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOverride, setEditingOverride] = useState<Override | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('active');

  // Load students for the dropdown
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

  // Load overrides
  const loadOverrides = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      setLoading(true);
      const overridesCollection = collection(db, 'schools', userProfile.schoolId, 'overrides');
      const q = query(overridesCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const overridesData: Override[] = [];
      snapshot.forEach((doc) => {
        const override = { id: doc.id, ...doc.data() } as Override;

        // Check if override has expired and update status
        const now = new Date();
        const endDate = override.endDate.toDate ? override.endDate.toDate() : new Date(override.endDate as any);
        override.isActive = endDate >= now;

        overridesData.push(override);
      });

      setOverrides(overridesData);
    } catch (error) {
      console.error('Error loading overrides:', error);
      alert('Failed to load overrides. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.schoolId]);

  useEffect(() => {
    loadStudents();
    loadOverrides();
  }, [loadStudents, loadOverrides]);

  // Auto-expire overrides that have passed their end date
  const expireOverride = async (overrideId: string) => {
    if (!userProfile?.schoolId) return;

    try {
      const overrideDoc = doc(db, 'schools', userProfile.schoolId, 'overrides', overrideId);
      await updateDoc(overrideDoc, {
        isActive: false
      });
      await loadOverrides();
    } catch (error) {
      console.error('Error expiring override:', error);
    }
  };

  const handleAddOverride = async (overrideData: OverrideFormData) => {
    if (!userProfile?.schoolId) return;

    try {
      const startDate = new Date(overrideData.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(overrideData.endDate);
      endDate.setHours(23, 59, 59, 999); // End at end of day

      const override: Omit<Override, 'id'> = {
        studentId: overrideData.studentId,
        carNumber: overrideData.carNumber,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        reason: overrideData.reason || '',
        createdBy: userProfile.uid,
        createdAt: Timestamp.now(),
        isActive: true
      };

      const overridesCollection = collection(db, 'schools', userProfile.schoolId, 'overrides');
      await addDoc(overridesCollection, override);

      await loadOverrides();
      setShowForm(false);
      alert('Override created successfully!');
    } catch (error) {
      console.error('Error adding override:', error);
      alert('Failed to create override. Please try again.');
    }
  };

  const handleUpdateOverride = async (overrideData: OverrideFormData) => {
    if (!userProfile?.schoolId || !editingOverride) return;

    try {
      const startDate = new Date(overrideData.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(overrideData.endDate);
      endDate.setHours(23, 59, 59, 999);

      const overrideDoc = doc(db, 'schools', userProfile.schoolId, 'overrides', editingOverride.id);
      await updateDoc(overrideDoc, {
        studentId: overrideData.studentId,
        carNumber: overrideData.carNumber,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        reason: overrideData.reason || '',
        isActive: endDate >= new Date()
      });

      await loadOverrides();
      setEditingOverride(null);
      setShowForm(false);
      alert('Override updated successfully!');
    } catch (error) {
      console.error('Error updating override:', error);
      alert('Failed to update override. Please try again.');
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!userProfile?.schoolId) return;
    if (!window.confirm('Are you sure you want to delete this override?')) return;

    try {
      const overrideDoc = doc(db, 'schools', userProfile.schoolId, 'overrides', overrideId);
      await deleteDoc(overrideDoc);

      await loadOverrides();
      alert('Override deleted successfully.');
    } catch (error) {
      console.error('Error deleting override:', error);
      alert('Failed to delete override. Please try again.');
    }
  };

  const handleEditOverride = (override: Override) => {
    setEditingOverride(override);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingOverride(null);
    setShowForm(false);
  };

  const handleToggleActive = async (override: Override) => {
    if (!userProfile?.schoolId) return;

    try {
      const overrideDoc = doc(db, 'schools', userProfile.schoolId, 'overrides', override.id);
      await updateDoc(overrideDoc, {
        isActive: !override.isActive
      });
      await loadOverrides();
    } catch (error) {
      console.error('Error toggling override status:', error);
      alert('Failed to update override status.');
    }
  };

  // Filter overrides based on search and status
  const filteredOverrides = overrides.filter(override => {
    const student = students.find(s => s.id === override.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : '';

    const matchesSearch = searchTerm === '' ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      override.carNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      override.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && override.isActive) ||
      (filterStatus === 'expired' && !override.isActive);

    return matchesSearch && matchesStatus;
  });

  // Get active overrides count for today
  const todayActiveCount = overrides.filter(override => {
    const now = new Date();
    const startDate = override.startDate.toDate ? override.startDate.toDate() : new Date(override.startDate as any);
    const endDate = override.endDate.toDate ? override.endDate.toDate() : new Date(override.endDate as any);

    return override.isActive &&
           startDate <= now &&
           endDate >= now;
  }).length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div>Loading overrides...</div>
      </div>
    );
  }

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
        <h1>Override Management</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          + Create Override
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by student name, car, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
              minWidth: '120px'
            }}
          >
            <option value="all">All Overrides</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
            {todayActiveCount}
          </div>
          <div style={{ color: '#155724' }}>Active Today</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
            {filteredOverrides.length}
          </div>
          <div style={{ color: '#666' }}>Showing</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#cce5ff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>
            {overrides.length}
          </div>
          <div style={{ color: '#004085' }}>Total Overrides</div>
        </div>
      </div>

      {/* Override Form Modal */}
      {showForm && (
        <OverrideForm
          override={editingOverride}
          students={students}
          onSubmit={editingOverride ? handleUpdateOverride : handleAddOverride}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Override List */}
      <OverrideList
        overrides={filteredOverrides}
        students={students}
        onEdit={handleEditOverride}
        onDelete={handleDeleteOverride}
        onToggleActive={handleToggleActive}
      />

      {filteredOverrides.length === 0 && searchTerm && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No overrides found</h3>
          <p>No overrides match your search criteria.</p>
        </div>
      )}

      {overrides.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No overrides yet</h3>
          <p>Create your first override to handle temporary pickup changes.</p>
        </div>
      )}
    </div>
  );
};

export default OverridesPage;