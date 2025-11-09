export interface CarSuggestion {
  carNumber: string;
  score: number;
  lastUsed?: Date;
  frequency: number;
}

export class CarSearchEngine {
  private historicalCars: Set<string> = new Set();
  private carFrequency: Map<string, number> = new Map();
  private lastUsed: Map<string, Date> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Normalize car number for consistent matching
  private normalize(carNumber: string): string {
    return carNumber
      .toLowerCase()
      .replace(/[\s-_.]/g, '') // Remove spaces, hyphens, underscores, dots
      .replace(/^0+/, ''); // Remove leading zeros
  }

  // Add car numbers from various sources
  addCarNumbers(cars: string[], source: 'dismissal' | 'student' = 'dismissal'): void {
    cars.forEach(car => {
      this.historicalCars.add(car);
      this.carFrequency.set(car, (this.carFrequency.get(car) || 0) + 1);

      if (source === 'dismissal') {
        this.lastUsed.set(car, new Date());
      }
    });
    this.saveToStorage();
  }

  // Calculate fuzzy match score
  private calculateScore(input: string, candidate: string): number {
    const normalizedInput = this.normalize(input);
    const normalizedCandidate = this.normalize(candidate);

    // Exact match gets highest score
    if (normalizedInput === normalizedCandidate) {
      return 100;
    }

    // Check if input is contained in candidate
    if (normalizedCandidate.includes(normalizedInput)) {
      const containmentScore = 80 - (normalizedCandidate.length - normalizedInput.length) * 2;
      return Math.max(containmentScore, 60);
    }

    // Check if candidate starts with input
    if (normalizedCandidate.startsWith(normalizedInput)) {
      return 70 - (normalizedCandidate.length - normalizedInput.length);
    }

    // Check character similarity (Levenshtein-like)
    const similarity = this.calculateSimilarity(normalizedInput, normalizedCandidate);
    if (similarity > 0.6) {
      return Math.floor(similarity * 50);
    }

    return 0;
  }

  // Simple character similarity calculation
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Get suggestions for input
  getSuggestions(input: string, maxResults: number = 5): CarSuggestion[] {
    if (!input.trim()) {
      return this.getRecentCars(maxResults);
    }

    const suggestions: CarSuggestion[] = [];

    this.historicalCars.forEach(carNumber => {
      const score = this.calculateScore(input, carNumber);

      if (score > 0) {
        suggestions.push({
          carNumber,
          score,
          lastUsed: this.lastUsed.get(carNumber),
          frequency: this.carFrequency.get(carNumber) || 1
        });
      }
    });

    // Sort by score, then by frequency, then by recency
    return suggestions
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;

        const aTime = a.lastUsed?.getTime() || 0;
        const bTime = b.lastUsed?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, maxResults);
  }

  // Get most recently used cars
  getRecentCars(limit: number = 5): CarSuggestion[] {
    const recentCars = Array.from(this.lastUsed.entries())
      .sort(([, a], [, b]) => b.getTime() - a.getTime())
      .slice(0, limit)
      .map(([carNumber, lastUsed]) => ({
        carNumber,
        score: 50,
        lastUsed,
        frequency: this.carFrequency.get(carNumber) || 1
      }));

    return recentCars;
  }

  // Get most frequently used cars
  getFrequentCars(limit: number = 5): CarSuggestion[] {
    return Array.from(this.carFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([carNumber, frequency]) => ({
        carNumber,
        score: 40,
        lastUsed: this.lastUsed.get(carNumber),
        frequency
      }));
  }

  // Highlight matching part of suggestion
  highlightMatch(suggestion: string, input: string): { prefix: string; match: string; suffix: string } {
    if (!input.trim()) {
      return { prefix: '', match: suggestion, suffix: '' };
    }

    const normalizedInput = this.normalize(input);
    const normalizedSuggestion = this.normalize(suggestion);

    const matchIndex = normalizedSuggestion.indexOf(normalizedInput);

    if (matchIndex === -1) {
      return { prefix: '', match: suggestion, suffix: '' };
    }

    // Map back to original string positions
    let originalIndex = 0;
    let normalizedIndex = 0;

    while (normalizedIndex < matchIndex && originalIndex < suggestion.length) {
      const char = suggestion[originalIndex];
      if (!/[\s-_.]/.test(char)) {
        normalizedIndex++;
      }
      originalIndex++;
    }

    const startIndex = originalIndex;
    let endIndex = startIndex;
    let matchedLength = 0;

    while (matchedLength < normalizedInput.length && endIndex < suggestion.length) {
      const char = suggestion[endIndex];
      if (!/[\s-_.]/.test(char)) {
        matchedLength++;
      }
      endIndex++;
    }

    return {
      prefix: suggestion.substring(0, startIndex),
      match: suggestion.substring(startIndex, endIndex),
      suffix: suggestion.substring(endIndex)
    };
  }

  // Storage methods
  private saveToStorage(): void {
    try {
      const data = {
        cars: Array.from(this.historicalCars),
        frequency: Array.from(this.carFrequency.entries()),
        lastUsed: Array.from(this.lastUsed.entries()).map(([car, date]) => [car, date.toISOString()])
      };
      localStorage.setItem('dismissal_car_history', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save car history to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('dismissal_car_history');
      if (stored) {
        const data = JSON.parse(stored);

        this.historicalCars = new Set(data.cars || []);
        this.carFrequency = new Map(data.frequency || []);
        this.lastUsed = new Map(
          (data.lastUsed || []).map(([car, dateStr]: [string, string]) => [car, new Date(dateStr)])
        );
      }
    } catch (error) {
      console.warn('Failed to load car history from localStorage:', error);
    }
  }

  // Clear all data
  clear(): void {
    this.historicalCars.clear();
    this.carFrequency.clear();
    this.lastUsed.clear();
    localStorage.removeItem('dismissal_car_history');
  }
}

// Export singleton instance
export const carSearchEngine = new CarSearchEngine();