import React, { useState } from 'react';
import QRScanner from './QRScanner';

interface CarInputProps {
  onCarSubmit: (carNumber: string) => void;
  loading: boolean;
  disabled: boolean;
}

const CarInput: React.FC<CarInputProps> = ({ onCarSubmit, loading, disabled }) => {
  const [carNumber, setCarNumber] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (carNumber.trim() && !disabled) {
      onCarSubmit(carNumber.trim());
      setCarNumber('');
    }
  };

  const handleQRScan = (scannedText: string) => {
    // Parse QR code - expecting format "DISMISSAL_CAR_XXX"
    const qrPrefix = 'DISMISSAL_CAR_';
    if (scannedText.startsWith(qrPrefix)) {
      const extractedCarNumber = scannedText.substring(qrPrefix.length);
      setCarNumber(extractedCarNumber);
      setShowQRScanner(false);
      onCarSubmit(extractedCarNumber);
    } else {
      alert('Invalid QR code format. Please use a valid car tag.');
    }
  };


  return (
    <>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Enter Car Number</h3>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              placeholder="Car number (e.g., 105, A-12)"
              disabled={disabled}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #007bff',
                borderRadius: '4px',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            />
            <button
              type="submit"
              disabled={disabled || !carNumber.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: disabled ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Looking up...' : 'Find Car'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            margin: '1rem 0',
            color: '#666',
            fontSize: '0.875rem'
          }}>
            - OR -
          </div>

          <button
            onClick={() => setShowQRScanner(true)}
            disabled={disabled}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: disabled ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            📱 Scan QR Code
          </button>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Type the car number and click "Find Car"</li>
            <li>Or scan the QR code on the car tag</li>
            <li>Students will appear with cone assignment</li>
            <li>Click "Dismiss" when students are loaded</li>
          </ul>
        </div>
      </div>

      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    </>
  );
};

export default CarInput;