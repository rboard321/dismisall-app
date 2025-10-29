import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

  useEffect(() => {
    const startScanningFunc = async () => {
      try {
        setError(null);
        setScanning(true);

        // Check if camera permission is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported in this browser');
        }

        // Request camera permission with rear camera preference
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' }, // Prefer rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(() => resolve());
              };
            }
          });

          // Start scanning
          const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);

          if (result) {
            onScan(result.getText());
            stopScanningFunc();
            onClose();
          }
        }
      } catch (err) {
        console.error('QR Scanner error:', err);

        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Camera permission denied. Please allow camera access and try again.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else if (err.name === 'NotSupportedError') {
            setError('Camera not supported in this browser.');
          } else if (err instanceof NotFoundException) {
            // This is expected when no QR code is found - continue scanning
            setTimeout(() => {
              if (isOpen && videoRef.current) {
                startScanningLoopFunc();
              }
            }, 100);
            return;
          } else {
            setError(`Camera error: ${err.message}`);
          }
        } else {
          setError('Unknown camera error occurred.');
        }

        setScanning(false);
      }
    };

    const startScanningLoopFunc = async () => {
      if (!videoRef.current || !isOpen) return;

      try {
        const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);

        if (result) {
          onScan(result.getText());
          stopScanningFunc();
          onClose();
        }
      } catch (err) {
        if (err instanceof NotFoundException) {
          // No QR code found, continue scanning
          setTimeout(() => {
            if (isOpen) {
              startScanningLoopFunc();
            }
          }, 100);
        } else {
          console.error('Scanning loop error:', err);
          setError('Scanning error occurred');
          setScanning(false);
        }
      }
    };

    const stopScanningFunc = () => {
      setScanning(false);

      // Stop the video stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Reset the video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Reset the code reader
      codeReader.current.reset();
    };

    if (isOpen) {
      startScanningFunc();
    } else {
      stopScanningFunc();
    }

    return () => {
      stopScanningFunc();
    };
  }, [isOpen, onScan, onClose, stream]);


  const handleManualEntry = () => {
    const carNumber = prompt('Enter car number manually:');
    if (carNumber && carNumber.trim()) {
      onScan(`DISMISSAL_CAR_${carNumber.trim()}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: 'white'
    }}>
      <div style={{
        backgroundColor: 'white',
        color: 'black',
        borderRadius: '12px',
        padding: '1rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0 }}>📱 Scan QR Code</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Camera View */}
        {!error && (
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '300px',
            aspectRatio: '1',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />

            {/* Scanning overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #00ff00',
              width: '80%',
              height: '80%',
              borderRadius: '8px',
              opacity: scanning ? 0.8 : 0.3
            }} />

            {/* Status overlay */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: '1rem',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {scanning ? '🔍 Looking for QR code...' : '📷 Starting camera...'}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            marginBottom: '1rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <strong>Camera Error:</strong><br />
            {error}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '6px',
          padding: '1rem',
          fontSize: '0.875rem',
          color: '#004085',
          marginBottom: '1rem',
          width: '100%'
        }}>
          <strong>📋 Instructions:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Point camera at the QR code on the car tag</li>
            <li>Keep the QR code within the green box</li>
            <li>Hold steady until the code is recognized</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleManualEntry}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              minWidth: '120px'
            }}
          >
            📝 Manual Entry
          </button>

          {error && (
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              🔄 Retry Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;