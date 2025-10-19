import React, { useState } from 'react';
import { DismissalSummary, Dismissal, Student } from '../types';

interface DismissalReportsProps {
  dismissalSummary: DismissalSummary;
  dismissals: Dismissal[];
  students: Student[];
  schoolId: string;
}

const DismissalReports: React.FC<DismissalReportsProps> = ({
  dismissalSummary,
  dismissals,
  students,
  schoolId
}) => {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'audit'>('summary');

  // Helper to get student name by ID
  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  // Helper to get student grade by ID
  const getStudentGrade = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student ? student.grade : 'Unknown';
  };

  // Generate CSV content for summary report
  const generateSummaryCSV = (): string => {
    const headers = ['Date', 'Total Cars', 'Total Students', 'Average Time (min)', 'Cone Utilization'];
    const data = [
      dismissalSummary.date,
      dismissalSummary.totalCars.toString(),
      dismissalSummary.totalStudents.toString(),
      dismissalSummary.averageDismissalTime.toString(),
      Object.entries(dismissalSummary.coneUtilization)
        .map(([cone, count]) => `Cone ${cone}: ${count}`)
        .join('; ')
    ];

    return [headers.join(','), data.join(',')].join('\n');
  };

  // Generate CSV content for detailed report
  const generateDetailedCSV = (): string => {
    const headers = [
      'Car Number',
      'Cone Number',
      'Student Count',
      'Student Names',
      'Student Grades',
      'Dismissed At',
      'Status'
    ];

    const rows = dismissals.map(dismissal => {
      const studentNames = dismissal.studentIds.map(getStudentName).join('; ');
      const studentGrades = dismissal.studentIds.map(getStudentGrade).join('; ');
      const dismissedAt = dismissal.dismissedAt.toDate
        ? dismissal.dismissedAt.toDate().toLocaleString()
        : new Date(dismissal.dismissedAt as any).toLocaleString();

      return [
        dismissal.carNumber,
        dismissal.coneNumber.toString(),
        dismissal.studentIds.length.toString(),
        `"${studentNames}"`,
        `"${studentGrades}"`,
        dismissedAt,
        dismissal.status
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Generate CSV content for audit trail
  const generateAuditCSV = (): string => {
    const headers = [
      'Timestamp',
      'Car Number',
      'Action',
      'Dismissed By',
      'Student Count',
      'Cone Number'
    ];

    const rows = dismissals.map(dismissal => {
      const timestamp = dismissal.dismissedAt.toDate
        ? dismissal.dismissedAt.toDate().toLocaleString()
        : new Date(dismissal.dismissedAt as any).toLocaleString();

      return [
        timestamp,
        dismissal.carNumber,
        'DISMISSED',
        dismissal.dismissedBy,
        dismissal.studentIds.length.toString(),
        dismissal.coneNumber.toString()
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Download CSV file
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type: 'summary' | 'detailed' | 'audit') => {
    const today = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = '';

    switch (type) {
      case 'summary':
        content = generateSummaryCSV();
        filename = `dismissal-summary-${schoolId}-${today}.csv`;
        break;
      case 'detailed':
        content = generateDetailedCSV();
        filename = `dismissal-detailed-${schoolId}-${today}.csv`;
        break;
      case 'audit':
        content = generateAuditCSV();
        filename = `dismissal-audit-${schoolId}-${today}.csv`;
        break;
    }

    downloadCSV(content, filename);
  };

  return (
    <div>
      {/* Export Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handleExport('summary')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📊 Export Summary
        </button>
        <button
          onClick={() => handleExport('detailed')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📋 Export Detailed
        </button>
        <button
          onClick={() => handleExport('audit')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🔍 Export Audit Trail
        </button>
      </div>

      {/* Report Type Selector */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dee2e6',
        marginBottom: '2rem',
        gap: '0.5rem'
      }}>
        {[
          { id: 'summary', label: 'Summary', icon: '📊' },
          { id: 'detailed', label: 'Detailed', icon: '📋' },
          { id: 'audit', label: 'Audit Trail', icon: '🔍' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: reportType === tab.id ? '#007bff' : 'transparent',
              color: reportType === tab.id ? 'white' : '#666',
              border: 'none',
              borderBottom: reportType === tab.id ? '2px solid #007bff' : '2px solid transparent',
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

      {/* Report Content */}
      {reportType === 'summary' && (
        <div>
          <h3>Daily Summary Report</h3>

          {/* Summary Cards */}
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
                {dismissalSummary.totalCars}
              </div>
              <div style={{ color: '#155724' }}>Total Cars</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#cce5ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>
                {dismissalSummary.totalStudents}
              </div>
              <div style={{ color: '#004085' }}>Total Students</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
                {dismissalSummary.averageDismissalTime.toFixed(1)}
              </div>
              <div style={{ color: '#856404' }}>Avg Time (min)</div>
            </div>
          </div>

          {/* Cone Utilization Chart */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h4 style={{ marginTop: 0 }}>Cone Utilization</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Object.keys(dismissalSummary.coneUtilization).length}, 1fr)`,
              gap: '1rem'
            }}>
              {Object.entries(dismissalSummary.coneUtilization).map(([coneNumber, count]) => (
                <div key={coneNumber} style={{ textAlign: 'center' }}>
                  <div style={{
                    height: `${Math.max(count * 20, 20)}px`,
                    backgroundColor: '#007bff',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    minHeight: '40px'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 0 4px 4px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    Cone {coneNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'detailed' && (
        <div>
          <h3>Detailed Dismissal Report</h3>

          {dismissals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666'
            }}>
              <h4>No dismissals recorded today</h4>
              <p>Dismissal records will appear here as cars are processed.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Car</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Cone</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Students</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dismissals.map((dismissal, index) => (
                    <tr
                      key={dismissal.id}
                      style={{
                        borderBottom: index < dismissals.length - 1 ? '1px solid #dee2e6' : 'none',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {dismissal.carNumber}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        Cone {dismissal.coneNumber}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <strong>{dismissal.studentIds.length} student{dismissal.studentIds.length !== 1 ? 's' : ''}</strong>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {dismissal.studentIds.map(getStudentName).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          {dismissal.dismissedAt.toDate
                            ? dismissal.dismissedAt.toDate().toLocaleTimeString()
                            : new Date(dismissal.dismissedAt as any).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportType === 'audit' && (
        <div>
          <h3>Audit Trail</h3>

          {dismissals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666'
            }}>
              <h4>No audit records for today</h4>
              <p>All dismissal actions will be logged here for security and compliance.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Timestamp</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Action</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Car/Students</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                  </tr>
                </thead>
                <tbody>
                  {dismissals.map((dismissal, index) => (
                    <tr
                      key={dismissal.id}
                      style={{
                        borderBottom: index < dismissals.length - 1 ? '1px solid #dee2e6' : 'none',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          {dismissal.dismissedAt.toDate
                            ? dismissal.dismissedAt.toDate().toLocaleString()
                            : new Date(dismissal.dismissedAt as any).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          DISMISSED
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <strong>Car {dismissal.carNumber}</strong> (Cone {dismissal.coneNumber})
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {dismissal.studentIds.length} student{dismissal.studentIds.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {dismissal.dismissedBy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Export Information */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>Report Information:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li><strong>Summary:</strong> High-level metrics and cone utilization data</li>
          <li><strong>Detailed:</strong> Complete record of all dismissals with student information</li>
          <li><strong>Audit Trail:</strong> Security log of all dismissal actions and users</li>
        </ul>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          All reports are exported as CSV files for easy integration with spreadsheet applications.
        </p>
      </div>
    </div>
  );
};

export default DismissalReports;