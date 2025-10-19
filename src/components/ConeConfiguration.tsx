import React, { useState } from 'react';

interface ConeConfigurationProps {
  currentConeCount: number;
  onUpdate: (coneCount: number) => Promise<void>;
  loading: boolean;
}

const ConeConfiguration: React.FC<ConeConfigurationProps> = ({
  currentConeCount,
  onUpdate,
  loading
}) => {
  const [coneCount, setConeCount] = useState(currentConeCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coneCount !== currentConeCount) {
      await onUpdate(coneCount);
    }
  };

  const presetOptions = [2, 3, 4, 5, 6, 8];

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '1.5rem'
    }}>
      <h3 style={{ marginTop: 0 }}>Cone Configuration</h3>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Set the number of cones for today's dismissal. This affects how cars are assigned
        to pickup locations.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Current Status */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Current Configuration
          </div>
          <div style={{ fontSize: '1.25rem', color: '#007bff' }}>
            {currentConeCount} cone{currentConeCount !== 1 ? 's' : ''} active
          </div>
        </div>

        {/* Preset Buttons */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Quick Select
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            {presetOptions.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setConeCount(preset)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: coneCount === preset ? '#007bff' : '#e9ecef',
                  color: coneCount === preset ? 'white' : '#333',
                  border: '1px solid ' + (coneCount === preset ? '#007bff' : '#ced4da'),
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Custom Count
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={coneCount}
            onChange={(e) => setConeCount(parseInt(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Enter a number between 1 and 12
          </small>
        </div>

        {/* Visual Preview */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Preview
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(coneCount, 6)}, 1fr)`,
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}>
            {Array.from({ length: coneCount }, (_, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '0.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}
              >
                🔴 {index + 1}
              </div>
            ))}
          </div>
          {coneCount > 6 && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#666',
              textAlign: 'center'
            }}>
              Showing first 6 cones. Total: {coneCount}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || coneCount === currentConeCount}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading || coneCount === currentConeCount ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || coneCount === currentConeCount ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Updating...' : coneCount === currentConeCount ? 'No Changes' : 'Update Cone Count'}
        </button>
      </form>

      {/* Information */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#004085'
      }}>
        <strong>ℹ️ Note:</strong> Changing the cone count will affect how new cars are assigned.
        Cars already assigned to cones will remain unchanged.
      </div>
    </div>
  );
};

export default ConeConfiguration;