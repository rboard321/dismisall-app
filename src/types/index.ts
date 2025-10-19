import { Timestamp } from 'firebase/firestore';

// User roles and authentication
export type UserRole = 'admin' | 'teacher' | 'staff' | 'front_office';

// Page permissions for granular access control
export type PagePermission =
  | 'CAR_LOOKUP'           // Access to car lookup/add to queue
  | 'MANAGEMENT'           // Access to cone queue management
  | 'ADMIN'                // Access to admin settings
  | 'CHECKIN'              // Access to student check-in
  | 'OVERRIDES'            // Access to manage overrides
  | 'SETUP'                // Access to teacher setup/configuration
  | 'REPORTS';             // Access to reports and analytics

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  permissions: PagePermission[]; // Granular page-level permissions
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// Student data structure
export interface Student {
  id: string;
  firstName: string;
  lastName: string; // Keep for backward compatibility
  lastInitial?: string; // Privacy-focused: only store last initial (optional for backward compatibility)
  grade: string;
  defaultCarNumber?: string;
  photoUrl?: string;
  studentId?: string;
  isWalker?: boolean;
  isAfterSchool?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Car data structure
export interface Car {
  carNumber: string;
  studentIds: string[];
  qrCode?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Override for temporary changes
export interface Override {
  id: string;
  studentId: string;
  carNumber: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason?: string;
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
}

// Lane/Cone management
export interface Lane {
  id: string;
  date: string; // YYYY-MM-DD format
  coneCount: number;
  currentPointer: number; // for round-robin assignment
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Dismissal record
export interface Dismissal {
  id: string;
  carNumber: string;
  studentIds: string[];
  coneNumber: number;
  dismissedBy: string; // user uid
  dismissedAt: Timestamp;
  status: 'waiting' | 'at_cone' | 'dismissed' | 'historical';
  resetAt?: Timestamp; // When this dismissal was reset to historical
}

// School configuration
export interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  website?: string;
  timezone: string;
  settings: {
    defaultConeCount: number;
    dismissalStartTime?: string;
    dismissalEndTime?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trialEndsAt?: Timestamp;
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Dashboard view models
export interface CarWithStudents {
  carNumber: string;
  students: StudentDisplay[];
  overrides: Override[];
  coneNumber?: number;
  status: 'waiting' | 'at_cone' | 'dismissed';
  arrivedAt?: Timestamp;
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
  lastInitial: string; // Change to last initial for privacy
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

// User invitation types
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  permissions: PagePermission[]; // Specific page permissions for this invitation
  schoolId: string;
  invitedBy: string; // user uid who sent the invitation
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Timestamp;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  inviteToken: string; // unique token for the invitation link
}