import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Student, StudentFormData } from '../types';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import BulkCarAssignment from '../components/BulkCarAssignment';

const CheckInPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!userProfile?.schoolId) {
      console.log('No schoolId in userProfile:', userProfile);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading students for school:', userProfile.schoolId);
      const studentsCollection = collection(db, 'schools', userProfile.schoolId, 'students');
      const snapshot = await getDocs(studentsCollection); // Remove ordering to avoid potential index issues

      console.log('Found', snapshot.size, 'students');
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Student data:', data);
        studentsData.push({ id: doc.id, ...data } as Student);
      });

      setStudents(studentsData);
      console.log('Students loaded successfully:', studentsData.length);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.schoolId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAddStudent = async (studentData: StudentFormData) => {
    if (!userProfile?.schoolId) return;

    try {
      const studentsCollection = collection(db, 'schools', userProfile.schoolId, 'students');
      await addDoc(studentsCollection, {
        firstName: studentData.firstName,
        lastName: studentData.lastInitial, // Store lastInitial in lastName for backward compatibility
        lastInitial: studentData.lastInitial,
        grade: studentData.grade,
        defaultCarNumber: studentData.defaultCarNumber,
        isWalker: studentData.isWalker,
        isAfterSchool: studentData.isAfterSchool,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await loadStudents();
      setShowForm(false);
      alert('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student. Please try again.');
    }
  };

  const handleUpdateStudent = async (studentData: StudentFormData) => {
    if (!userProfile?.schoolId || !editingStudent) return;

    try {
      const studentDoc = doc(db, 'schools', userProfile.schoolId, 'students', editingStudent.id);
      await updateDoc(studentDoc, {
        firstName: studentData.firstName,
        lastName: studentData.lastInitial, // Store lastInitial in lastName for backward compatibility
        lastInitial: studentData.lastInitial,
        grade: studentData.grade,
        defaultCarNumber: studentData.defaultCarNumber,
        isWalker: studentData.isWalker,
        isAfterSchool: studentData.isAfterSchool,
        updatedAt: Timestamp.now()
      });

      await loadStudents();
      setEditingStudent(null);
      setShowForm(false);
      alert('Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student. Please try again.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!userProfile?.schoolId) return;
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

    try {
      const studentDoc = doc(db, 'schools', userProfile.schoolId, 'students', studentId);
      await deleteDoc(studentDoc);

      await loadStudents();
      alert('Student deleted successfully.');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student. Please try again.');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setShowForm(false);
  };

  // Calculate filtered students
  const filteredStudents = students.filter(student => {
    const studentName = `${student.firstName} ${student.lastInitial || (student.lastName ? student.lastName.charAt(0) : '')}`;
    const matchesSearch = searchTerm === '' ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === '' || student.grade === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  // Bulk selection handlers
  const handleStudentSelect = (studentId: string, selected: boolean) => {
    if (selected) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Bulk car assignment
  const handleBulkCarAssignment = async (studentIds: string[], carNumber: string) => {
    if (!userProfile?.schoolId) return;

    try {
      // Update all selected students with the new car number
      const updatePromises = studentIds.map(studentId => {
        const studentDoc = doc(db, 'schools', userProfile.schoolId!, 'students', studentId);
        return updateDoc(studentDoc, {
          defaultCarNumber: carNumber,
          isWalker: false, // Clear walker status if assigning car
          isAfterSchool: false, // Clear after school status if assigning car
          updatedAt: Timestamp.now()
        });
      });

      await Promise.all(updatePromises);
      await loadStudents();
      setSelectedStudents([]);
      setShowBulkAssignment(false);
      alert(`Successfully assigned car ${carNumber} to ${studentIds.length} student${studentIds.length !== 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error updating car assignments:', error);
      throw error;
    }
  };

  const grades = Array.from(new Set(students.map(s => s.grade))).sort();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div>Loading students...</div>
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
        <h1>Student Management</h1>
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
          + Add Student
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
            placeholder="Search students by name or ID..."
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
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
              minWidth: '120px'
            }}
          >
            <option value="">All Grades</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
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
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            {filteredStudents.length}
          </div>
          <div style={{ color: '#666' }}>Students Shown</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            {students.length}
          </div>
          <div style={{ color: '#666' }}>Total Students</div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
            {grades.length}
          </div>
          <div style={{ color: '#666' }}>Grades</div>
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Bulk Assignment Controls */}
      {selectedStudents.length > 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong>{selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowBulkAssignment(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🚗 Assign Car Number
            </button>
            <button
              onClick={() => setSelectedStudents([])}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      <StudentList
        students={filteredStudents}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        selectedStudents={selectedStudents}
        onStudentSelect={handleStudentSelect}
        onSelectAll={handleSelectAll}
        allowBulkSelection={true}
      />

      {/* Bulk Car Assignment Modal */}
      {showBulkAssignment && (
        <BulkCarAssignment
          selectedStudents={students.filter(s => selectedStudents.includes(s.id))}
          onAssign={handleBulkCarAssignment}
          onCancel={() => setShowBulkAssignment(false)}
          loading={loading}
        />
      )}

      {filteredStudents.length === 0 && searchTerm && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No students found</h3>
          <p>No students match your search criteria.</p>
        </div>
      )}

      {students.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No students yet</h3>
          <p>Get started by adding your first student.</p>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
