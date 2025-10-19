import React, { useState, useEffect } from 'react';
import { Student, StudentFormData } from '../types';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (studentData: StudentFormData) => Promise<void>;
  onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastInitial: '',
    grade: '',
    defaultCarNumber: '',
    isWalker: false,
    isAfterSchool: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastInitial: student.lastInitial || (student.lastName ? student.lastName.charAt(0).toUpperCase() : ''),
        grade: student.grade,
        defaultCarNumber: student.defaultCarNumber || '',
        isWalker: student.isWalker || false,
        isAfterSchool: student.isAfterSchool || false
      });
    }
  }, [student]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastInitial.trim()) {
      newErrors.lastInitial = 'Last initial is required';
    } else if (formData.lastInitial.length !== 1 || !/^[A-Za-z]$/.test(formData.lastInitial)) {
      newErrors.lastInitial = 'Please enter only one letter for last initial';
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }

    if (!formData.isWalker && !formData.isAfterSchool && !formData.defaultCarNumber?.trim()) {
      newErrors.transportation = 'Please specify car number, or mark as walker/after school';
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

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
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

  const grades = [
    'Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
  ];

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: errors.firstName ? '2px solid #dc3545' : '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.firstName}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Last Initial *
              </label>
              <input
                type="text"
                value={formData.lastInitial}
                onChange={(e) => handleInputChange('lastInitial', e.target.value.toUpperCase().slice(0, 1))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: errors.lastInitial ? '2px solid #dc3545' : '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
                placeholder="Enter last initial (e.g., S)"
                maxLength={1}
              />
              {errors.lastInitial && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.lastInitial}
                </div>
              )}
            </div>
          </div>

          {/* Grade */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Grade *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => handleInputChange('grade', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.grade ? '2px solid #dc3545' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select Grade</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {errors.grade && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.grade}
              </div>
            )}
          </div>

          {/* Transportation Options */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Transportation
            </label>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isWalker}
                  onChange={(e) => {
                    handleInputChange('isWalker', e.target.checked);
                    if (e.target.checked) {
                      handleInputChange('isAfterSchool', false);
                      handleInputChange('defaultCarNumber', '');
                    }
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                Walker (dismissed on foot)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isAfterSchool}
                  onChange={(e) => {
                    handleInputChange('isAfterSchool', e.target.checked);
                    if (e.target.checked) {
                      handleInputChange('isWalker', false);
                      handleInputChange('defaultCarNumber', '');
                    }
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                After School Program
              </label>
            </div>

            {!formData.isWalker && !formData.isAfterSchool && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Default Car Number
                </label>
                <input
                  type="text"
                  value={formData.defaultCarNumber}
                  onChange={(e) => handleInputChange('defaultCarNumber', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: errors.transportation ? '2px solid #dc3545' : '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., 105, A-12"
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  This car number will be used unless overridden for specific days
                </small>
              </div>
            )}

            {errors.transportation && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.transportation}
              </div>
            )}
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
              {loading ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;