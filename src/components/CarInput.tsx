import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import QRScanner from './QRScanner';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { carSearchEngine, CarSuggestion } from '../utils/carSearch';
import { voiceInputManager, CarNumberProcessor } from '../utils/voiceInput';
import { useAnimations } from '../utils/feedback';
import { Student, Dismissal } from '../types';
import '../styles/CarInput.css';

interface CarInputProps {
  onCarSubmit: (carNumber: string) => void;
  loading: boolean;
  disabled: boolean;
}

const CarInput: React.FC<CarInputProps> = ({ onCarSubmit, loading, disabled }) => {
  const { userProfile } = useAuth();
  const [carNumber, setCarNumber] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [suggestions, setSuggestions] = useState<CarSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentCars, setRecentCars] = useState<CarSuggestion[]>([]);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { haptic, animate, celebrate } = useAnimations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCarNumber = carNumber.trim();
    if (trimmedCarNumber && !disabled) {
      // Haptic feedback for submission
      haptic.medium();

      // Add celebration animation
      if (inputRef.current) {
        celebrate.checkmark(inputRef.current);
      }

      // Add to search engine for future suggestions
      carSearchEngine.addCarNumbers([trimmedCarNumber], 'dismissal');
      onCarSubmit(trimmedCarNumber);
      setCarNumber('');
      setShowSuggestions(false);
      updateRecentCars();
    } else if (!trimmedCarNumber) {
      // Shake animation for empty input
      if (inputRef.current) {
        animate.shake(inputRef.current);
        haptic.error();
      }
    }
  };

  const handleQRScan = (scannedText: string) => {
    // Parse QR code - expecting format "DISMISSAL_CAR_XXX"
    const qrPrefix = 'DISMISSAL_CAR_';
    if (scannedText.startsWith(qrPrefix)) {
      const extractedCarNumber = scannedText.substring(qrPrefix.length);
      carSearchEngine.addCarNumbers([extractedCarNumber], 'dismissal');
      setCarNumber(extractedCarNumber);
      setShowQRScanner(false);
      onCarSubmit(extractedCarNumber);
      updateRecentCars();
    } else {
      alert('Invalid QR code format. Please use a valid car tag.');
    }
  };

  // Load historical car data
  const loadHistoricalData = useCallback(async () => {
    if (!userProfile?.schoolId) return;

    try {
      // Load car numbers from students
      const studentsCollection = collection(db, 'schools', userProfile.schoolId, 'students');
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentCarNumbers: string[] = [];

      studentsSnapshot.forEach((doc) => {
        const student = doc.data() as Student;
        if (student.defaultCarNumber) {
          studentCarNumbers.push(student.defaultCarNumber);
        }
      });

      // Load car numbers from recent dismissals
      const dismissalsCollection = collection(db, 'schools', userProfile.schoolId, 'dismissals');
      const dismissalsSnapshot = await getDocs(dismissalsCollection);
      const dismissalCarNumbers: string[] = [];

      dismissalsSnapshot.forEach((doc) => {
        const dismissal = doc.data() as Dismissal;
        if (dismissal.carNumber) {
          dismissalCarNumbers.push(dismissal.carNumber);
        }
      });

      // Add to search engine
      carSearchEngine.addCarNumbers(studentCarNumbers, 'student');
      carSearchEngine.addCarNumbers(dismissalCarNumbers, 'dismissal');

      updateRecentCars();
    } catch (error) {
      console.error('Error loading historical car data:', error);
    }
  }, [userProfile?.schoolId]);

  // Update recent cars display
  const updateRecentCars = () => {
    setRecentCars(carSearchEngine.getRecentCars(4));
  };

  // Handle input change and update suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCarNumber(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      const newSuggestions = carSearchEngine.getSuggestions(value, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex].carNumber);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Select a suggestion
  const selectSuggestion = (selectedCarNumber: string) => {
    setCarNumber(selectedCarNumber);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Select recent car
  const selectRecentCar = (selectedCarNumber: string) => {
    carSearchEngine.addCarNumbers([selectedCarNumber], 'dismissal');
    onCarSubmit(selectedCarNumber);
    setCarNumber('');
    updateRecentCars();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize voice support and load data on mount
  useEffect(() => {
    setIsVoiceSupported(voiceInputManager.isVoiceSupported());
    loadHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.schoolId]);

  // Voice input handlers
  const startVoiceInput = () => {
    if (!isVoiceSupported || disabled) return;

    setVoiceError(null);
    setVoiceText('');

    const success = voiceInputManager.startListening({
      onStart: () => {
        setIsListening(true);
        setVoiceText('Listening...');
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceText('');
      },
      onError: (error: string) => {
        setIsListening(false);
        setVoiceError(error);
        setVoiceText('');
        console.error('Voice input error:', error);
      },
      onResult: (text: string) => {
        setIsListening(false);
        setVoiceText(`Heard: "${text}"`);

        // Extract car number from speech
        const extractedCarNumber = CarNumberProcessor.extractCarNumber(text);

        if (extractedCarNumber && CarNumberProcessor.isValidCarNumber(extractedCarNumber)) {
          // Add to search engine and submit
          carSearchEngine.addCarNumbers([extractedCarNumber], 'dismissal');
          onCarSubmit(extractedCarNumber);
          updateRecentCars();
          setVoiceText(`Found car: ${extractedCarNumber}`);

          // Clear the success message after a delay
          setTimeout(() => setVoiceText(''), 3000);
        } else {
          setVoiceError(`Could not find a car number in: "${text}". Try saying "Car 105" or just "105".`);
          setVoiceText('');
        }
      },
      language: 'en-US',
      continuous: false,
      interimResults: false
    });

    if (!success) {
      setVoiceError('Failed to start voice recognition');
    }
  };

  const stopVoiceInput = () => {
    voiceInputManager.stopListening();
    setIsListening(false);
    setVoiceText('');
  };

  // Clear voice error after a delay
  useEffect(() => {
    if (voiceError) {
      const timer = setTimeout(() => setVoiceError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [voiceError]);


  return (
    <div className="car-input-container">
      <div className="car-input-form">
        {/* Recent Cars Quick Select */}
        {recentCars.length > 0 && !carNumber && (
          <div className="recent-cars">
            <h3 className="recent-cars-title">🕒 Recent Cars</h3>
            <div className="recent-cars-grid">
              {recentCars.map((car) => (
                <button
                  key={car.carNumber}
                  onClick={() => selectRecentCar(car.carNumber)}
                  disabled={disabled}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: disabled ? '#f8f9fa' : '#e7f3ff',
                    color: disabled ? '#666' : '#004085',
                    border: disabled ? '1px solid #dee2e6' : '1px solid #b3d9ff',
                    borderRadius: '20px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.backgroundColor = '#007bff';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.backgroundColor = '#e7f3ff';
                      e.currentTarget.style.color = '#004085';
                    }
                  }}
                >
                  {car.carNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={carNumber}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (carNumber.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Car number (e.g., 105, A-12)"
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: showSuggestions ? '2px solid #28a745' : '2px solid #007bff',
                    borderRadius: showSuggestions ? '4px 4px 0 0' : '4px',
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    transition: 'border-color 0.2s ease'
                  }}
                />

                {/* Auto-complete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '2px solid #28a745',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {suggestions.map((suggestion, index) => {
                      const highlight = carSearchEngine.highlightMatch(suggestion.carNumber, carNumber);
                      return (
                        <div
                          key={suggestion.carNumber}
                          onClick={() => selectSuggestion(suggestion.carNumber)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            backgroundColor: index === selectedIndex ? '#e7f3ff' : 'white',
                            borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            <span>{highlight.prefix}</span>
                            <span style={{
                              backgroundColor: '#ffeb3b',
                              color: '#333',
                              padding: '0 2px',
                              borderRadius: '2px'
                            }}>
                              {highlight.match}
                            </span>
                            <span>{highlight.suffix}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#666'
                          }}>
                            {suggestion.frequency > 1 && (
                              <span>×{suggestion.frequency}</span>
                            )}
                            {suggestion.lastUsed && (
                              <span>🕒</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
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
                minWidth: '140px'
              }}
            >
              📱 Scan QR Code
            </button>

            {/* Voice Input Button */}
            {isVoiceSupported && (
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={disabled}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: disabled ? '#ccc' : isListening ? '#dc3545' : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '140px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isListening && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
                    backgroundSize: '20px 20px',
                    animation: 'voice-listening 1s linear infinite'
                  }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  🎤 {isListening ? 'Stop' : 'Voice Input'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Voice Status Display */}
        {(voiceText || voiceError) && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: voiceError ? '#f8d7da' : '#d1ecf1',
            color: voiceError ? '#721c24' : '#0c5460',
            border: voiceError ? '1px solid #f5c6cb' : '1px solid #bee5eb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isListening && (
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#dc3545',
                borderRadius: '50%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            )}
            <span>{voiceError || voiceText}</span>
          </div>
        )}

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
            {isVoiceSupported && (
              <li>Or use voice input: say "Car 105" or just "105"</li>
            )}
            <li>Recent cars appear as quick-select buttons</li>
            <li>Auto-complete suggestions appear as you type</li>
          </ul>
          {isVoiceSupported && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '4px' }}>
              <strong>🎤 Voice Examples:</strong> {CarNumberProcessor.getExamplePhrases().join(', ')}
            </div>
          )}
        </div>

        {/* Add CSS animations */}
        <style>{`
          @keyframes voice-listening {
            0% { transform: translateX(-20px); }
            100% { transform: translateX(20px); }
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
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