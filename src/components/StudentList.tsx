import React from 'react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  selectedStudents?: string[];
  onStudentSelect?: (studentId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  allowBulkSelection?: boolean;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  onEdit,
  onDelete,
  selectedStudents = [],
  onStudentSelect,
  onSelectAll,
  allowBulkSelection = false
}) => {
  const getTransportationDisplay = (student: Student): string => {
    if (student.isWalker) return '🚶 Walker';
    if (student.isAfterSchool) return '🏫 After School';
    return student.defaultCarNumber ? `🚗 Car ${student.defaultCarNumber}` : '🚗 Car TBD';
  };

  const getTransportationColor = (student: Student): string => {
    if (student.isWalker) return '#28a745';
    if (student.isAfterSchool) return '#ffc107';
    return student.defaultCarNumber ? '#007bff' : '#dc3545';
  };

  if (students.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Table View for larger screens, Card View for mobile */}
      <div className="desktop-view" style={{ display: 'block' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                {allowBulkSelection && (
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onChange={(e) => onSelectAll?.(e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </th>
                )}
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Grade</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Transportation</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: index < students.length - 1 ? '1px solid #dee2e6' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}
                >
                  {allowBulkSelection && (
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => onStudentSelect?.(student.id, e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {student.firstName} {student.lastInitial || (student.lastName ? student.lastName.charAt(0).toUpperCase() : '')}.
                    </div>
                    {student.studentId && (
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        ID: {student.studentId}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e9ecef',
                      borderRadius: '12px',
                      fontSize: '0.875rem'
                    }}>
                      {student.grade}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      color: getTransportationColor(student),
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {getTransportationDisplay(student)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => onEdit(student)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        marginRight: '0.5rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(student.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;