import React, { useState, useEffect } from 'react';
import { Override, Student, OverrideFormData } from '../types';

interface OverrideFormProps {
  override?: Override | null;
  students: Student[];
  onSubmit: (overrideData: OverrideFormData) => Promise<void>;
  onCancel: () => void;
}

const OverrideForm: React.FC<OverrideFormProps> = ({ override, students, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<OverrideFormData>({
    studentId: '',
    carNumber: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (override) {
      const startDate = override.startDate.toDate ? override.startDate.toDate() : override.startDate as any;
      const endDate = override.endDate.toDate ? override.endDate.toDate() : override.endDate as any;

      setFormData({
        studentId: override.studentId,
        carNumber: override.carNumber,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: override.reason || ''
      });
    } else {
      // Set default dates for new overrides
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      setFormData({
        studentId: '',
        carNumber: '',
        startDate: todayStr,
        endDate: todayStr,
        reason: ''
      });
    }
  }, [override]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.studentId) {
      newErrors.studentId = 'Please select a student';
    }

    if (!formData.carNumber.trim()) {
      newErrors.carNumber = 'Car number is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Check if dates are too far in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (end < today && !override) {
        newErrors.endDate = 'End date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OverrideFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        label: 'Today Only',
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Tomorrow Only',
        start: tomorrow.toISOString().split('T')[0],
        end: tomorrow.toISOString().split('T')[0]
      },
      {
        label: 'Rest of Week',
        start: today.toISOString().split('T')[0],
        end: nextWeek.toISOString().split('T')[0]
      }
    ];
  };

  const selectedStudent = students.find(s => s.id === formData.studentId);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>{override ? 'Edit Override' : 'Create New Override'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Student Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Student *
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.studentId ? '2px solid #dc3545' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} (Grade {student.grade})
                </option>
              ))}
            </select>
            {errors.studentId && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.studentId}
              </div>
            )}
            {selectedStudent && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: '#666'
              }}>
                <strong>Current assignment:</strong> {
                  selectedStudent.isWalker ? 'Walker' :
                  selectedStudent.isAfterSchool ? 'After School' :
                  selectedStudent.defaultCarNumber ? `Car ${selectedStudent.defaultCarNumber}` :
                  'No default car'
                }
              </div>
            )}
          </div>

          {/* Car Number */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              New Car Number *
            </label>
            <input
              type="text"
              value={formData.carNumber}
              onChange={(e) => handleInputChange('carNumber', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.carNumber ? '2px solid #dc3545' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="e.g., 105, A-12"
            />
            {errors.carNumber && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.carNumber}
              </div>
            )}
          </div>

          {/* Quick Date Options */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Quick Options
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {getQuickDateOptions().map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    handleInputChange('startDate', option.start);
                    handleInputChange('endDate', option.end);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: errors.startDate ? '2px solid #dc3545' : '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {errors.startDate && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.startDate}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: errors.endDate ? '2px solid #dc3545' : '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {errors.endDate && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.endDate}
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Reason (optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="e.g., Parent traveling, emergency pickup, etc."
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Saving...' : (override ? 'Update Override' : 'Create Override')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OverrideForm;