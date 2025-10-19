// User roles and authentication
export type UserRole = 'admin' | 'teacher' | 'staff' | 'front_office';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  createdAt: Date;
  lastLogin: Date;
}

// Student data structure
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  defaultCarNumber?: string;
  photoUrl?: string;
  studentId?: string;
  isWalker?: boolean;
  isAfterSchool?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Car data structure
export interface Car {
  carNumber: string;
  studentIds: string[];
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Override for temporary changes
export interface Override {
  id: string;
  studentId: string;
  carNumber: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

// Lane/Cone management
export interface Lane {
  id: string;
  date: string; // YYYY-MM-DD format
  coneCount: number;
  currentPointer: number; // for round-robin assignment
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dismissal record
export interface Dismissal {
  id: string;
  carNumber: string;
  studentIds: string[];
  coneNumber: number;
  dismissedBy: string; // user uid
  dismissedAt: Date;
  status: 'waiting' | 'at_cone' | 'dismissed';
}

// School configuration
export interface School {
  id: string;
  name: string;
  address?: string;
  timezone: string;
  settings: {
    defaultConeCount: number;
    dismissalStartTime?: string;
    dismissalEndTime?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard view models
export interface CarWithStudents {
  carNumber: string;
  students: StudentDisplay[];
  overrides: Override[];
  coneNumber?: number;
  status: 'waiting' | 'at_cone' | 'dismissed';
  arrivedAt?: Date;
}

export interface StudentDisplay {
  id: string;
  displayName: string; // First name + Last initial
  grade: string;
  isOverride?: boolean;
}

// API response types
export interface DismissalSummary {
  date: string;
  totalStudents: number;
  totalCars: number;
  averageDismissalTime: number;
  coneUtilization: { [coneNumber: number]: number };
}

// Form types
export interface StudentFormData {
  firstName: string;
  lastName: string;
  grade: string;
  defaultCarNumber?: string;
  isWalker?: boolean;
  isAfterSchool?: boolean;
}

export interface OverrideFormData {
  studentId: string;
  carNumber: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// QR Scanner types
export interface QRScanResult {
  text: string;
  carNumber?: string;
  isValid: boolean;
}