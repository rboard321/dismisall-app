import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole, School, PagePermission } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  schoolProfile: School | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserRole: (uid: string, role: UserRole, schoolId: string, permissions?: PagePermission[]) => Promise<void>;
  isTrialExpired: boolean;
  isSubscriptionActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get default permissions based on role
const getDefaultPermissions = (role: UserRole): PagePermission[] => {
  switch (role) {
    case 'admin':
      return ['CAR_LOOKUP', 'MANAGEMENT', 'ADMIN', 'CHECKIN', 'OVERRIDES', 'SETUP', 'REPORTS'];
    case 'teacher':
      return ['CAR_LOOKUP', 'MANAGEMENT', 'SETUP'];
    case 'staff':
      return ['CAR_LOOKUP', 'MANAGEMENT'];
    case 'front_office':
      return ['CHECKIN', 'OVERRIDES', 'REPORTS'];
    default:
      return [];
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserRole = async (uid: string, role: UserRole, schoolId: string, permissions?: PagePermission[]) => {
    const userDoc = doc(db, 'users', uid);
    const finalPermissions = permissions || getDefaultPermissions(role);

    await setDoc(userDoc, {
      uid,
      email: currentUser?.email || '',
      displayName: currentUser?.displayName || '',
      role,
      schoolId,
      permissions: finalPermissions,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    }, { merge: true });
  };

  const loadSchoolProfile = async (schoolId: string) => {
    try {
      const schoolDoc = doc(db, 'schools', schoolId);
      const schoolSnap = await getDoc(schoolDoc);

      if (schoolSnap.exists()) {
        const schoolData = { id: schoolDoc.id, ...schoolSnap.data() } as School;
        setSchoolProfile(schoolData);
      } else {
        console.error('School not found:', schoolId);
        setSchoolProfile(null);
      }
    } catch (error) {
      console.error('Error loading school profile:', error);
      setSchoolProfile(null);
    }
  };

  const loadUserProfile = async (user: FirebaseUser) => {
    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;

        // Ensure permissions exist, add defaults if missing (in memory only)
        if (!userData.permissions || userData.permissions.length === 0) {
          userData.permissions = getDefaultPermissions(userData.role);
        }

        setUserProfile(userData);

        // Load school profile if user has schoolId
        if (userData.schoolId) {
          await loadSchoolProfile(userData.schoolId);
        }

        // Update last login
        await setDoc(userDoc, {
          lastLogin: Timestamp.now()
        }, { merge: true });
      } else {
        // New user without profile - they need to register a school or join one
        console.log('User without profile found:', user.email);
        setUserProfile(null);
        setSchoolProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
      setSchoolProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
        setSchoolProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Calculate subscription status
  const isTrialExpired = schoolProfile?.trialEndsAt ?
    schoolProfile.trialEndsAt.toDate() < new Date() : false;

  const isSubscriptionActive = schoolProfile?.subscriptionStatus === 'active' ||
    (schoolProfile?.subscriptionStatus === 'trial' && !isTrialExpired);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    schoolProfile,
    loading,
    logout,
    updateUserRole,
    isTrialExpired,
    isSubscriptionActive
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}