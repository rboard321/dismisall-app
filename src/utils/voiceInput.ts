interface VoiceInputOptions {
  onResult: (text: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class VoiceInputManager {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private options: VoiceInputOptions | null = null;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public isVoiceSupported(): boolean {
    return this.isSupported;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public startListening(options: VoiceInputOptions): boolean {
    if (!this.isSupported) {
      options.onError('Voice recognition is not supported in this browser');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.options = options;

    try {
      // Create recognition instance
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configure recognition
      this.recognition.continuous = options.continuous || false;
      this.recognition.interimResults = options.interimResults || false;
      this.recognition.lang = options.language || 'en-US';
      this.recognition.maxAlternatives = 1;

      // Set up event handlers
      this.recognition.onstart = () => {
        this.isListening = true;
        options.onStart();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options.onEnd();
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech was detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone was found. Please check your microphone settings.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error occurred during speech recognition.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service is not allowed.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        options.onError(errorMessage);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
          // Note: interim results are handled in continuous mode if needed
        }

        // Process the final result
        if (finalTranscript) {
          options.onResult(finalTranscript.trim());
        }
      };

      // Start recognition
      this.recognition.start();
      return true;

    } catch (error) {
      this.isListening = false;
      options.onError(`Failed to start voice recognition: ${error}`);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
  }

  public abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
    this.isListening = false;
  }
}

// Car number extraction from speech
export class CarNumberProcessor {
  // Common patterns for car numbers
  private static readonly CAR_PATTERNS = [
    // "Car 105", "car number 105"
    /(?:car|car number)\s*(\d+)/i,
    // "105", "A 105", "A-105"
    /([A-Z]?\s*-?\s*\d+)/i,
    // "A one oh five", "one oh five"
    /([A-Z]?\s*(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)+)/i,
    // Just numbers
    /(\d+)/
  ];

  // Word to number conversion
  private static readonly WORD_TO_NUMBER: { [key: string]: string } = {
    'zero': '0', 'oh': '0', 'o': '0',
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
    'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
    'eighty': '80', 'ninety': '90', 'hundred': '100'
  };

  public static extractCarNumber(speechText: string): string | null {
    const normalizedText = speechText.toLowerCase().trim();

    // Try each pattern
    for (const pattern of this.CAR_PATTERNS) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let carNumber = match[1].trim();

        // Convert words to numbers if needed
        carNumber = this.convertWordsToNumbers(carNumber);

        // Clean up the result
        carNumber = carNumber.replace(/\s+/g, '').replace(/^-+/, '');

        if (carNumber && carNumber.length > 0) {
          return carNumber.toUpperCase();
        }
      }
    }

    return null;
  }

  private static convertWordsToNumbers(text: string): string {
    let result = text.toLowerCase();

    // Replace word numbers with digits
    Object.entries(this.WORD_TO_NUMBER).forEach(([word, digit]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, digit);
    });

    // Handle compound numbers like "twenty five" -> "25"
    result = result.replace(/(\d+)\s+(\d+)/g, (match, p1, p2) => {
      const num1 = parseInt(p1);
      const num2 = parseInt(p2);

      // If first number is a multiple of 10 and second is less than 10, combine them
      if (num1 % 10 === 0 && num2 < 10) {
        return (num1 + num2).toString();
      }

      return match;
    });

    return result;
  }

  // Get example phrases for user guidance
  public static getExamplePhrases(): string[] {
    return [
      'Car 105',
      'Car number A-25',
      'One oh five',
      'A twenty three',
      'Car forty two'
    ];
  }

  // Validate if extracted car number seems reasonable
  public static isValidCarNumber(carNumber: string): boolean {
    // Should contain at least one digit
    if (!/\d/.test(carNumber)) return false;

    // Should not be too long
    if (carNumber.length > 10) return false;

    // Should not start with too many zeros
    if (/^0{3,}/.test(carNumber)) return false;

    return true;
  }
}

// Export singleton instance
export const voiceInputManager = new VoiceInputManager();