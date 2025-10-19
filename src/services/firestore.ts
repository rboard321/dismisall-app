import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Student,
  Car,
  Override,
  Lane,
  Dismissal,
  School,
  User
} from '../types';

// Collection references for multi-tenant structure
export const getSchoolCollection = (schoolId: string, collectionName: string) => {
  return collection(db, 'schools', schoolId, collectionName);
};

// User management
export const getUserDoc = (uid: string) => doc(db, 'users', uid);

export const createUser = async (user: Omit<User, 'createdAt' | 'lastLogin'>) => {
  const userWithTimestamps = {
    ...user,
    createdAt: Timestamp.now(),
    lastLogin: Timestamp.now()
  };
  return await updateDoc(getUserDoc(user.uid), userWithTimestamps);
};

// Student management
export const getStudentsCollection = (schoolId: string) =>
  getSchoolCollection(schoolId, 'students');

export const addStudent = async (schoolId: string, student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
  const studentWithTimestamps = {
    ...student,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  return await addDoc(getStudentsCollection(schoolId), studentWithTimestamps);
};

export const updateStudent = async (schoolId: string, studentId: string, updates: Partial<Student>) => {
  const studentDoc = doc(getStudentsCollection(schoolId), studentId);
  return await updateDoc(studentDoc, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteStudent = async (schoolId: string, studentId: string) => {
  const studentDoc = doc(getStudentsCollection(schoolId), studentId);
  return await deleteDoc(studentDoc);
};

// Car management
export const getCarsCollection = (schoolId: string) =>
  getSchoolCollection(schoolId, 'cars');

export const addCar = async (schoolId: string, car: Omit<Car, 'createdAt' | 'updatedAt'>) => {
  const carWithTimestamps = {
    ...car,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  return await addDoc(getCarsCollection(schoolId), carWithTimestamps);
};

export const updateCar = async (schoolId: string, carNumber: string, updates: Partial<Car>) => {
  const carDoc = doc(getCarsCollection(schoolId), carNumber);
  return await updateDoc(carDoc, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

// Override management
export const getOverridesCollection = (schoolId: string) =>
  getSchoolCollection(schoolId, 'overrides');

export const addOverride = async (schoolId: string, override: Omit<Override, 'id' | 'createdAt'>) => {
  const overrideWithTimestamp = {
    ...override,
    createdAt: Timestamp.now()
  };
  return await addDoc(getOverridesCollection(schoolId), overrideWithTimestamp);
};

export const getActiveOverrides = async (schoolId: string) => {
  const overridesCollection = getOverridesCollection(schoolId);
  const q = query(
    overridesCollection,
    where('isActive', '==', true),
    where('endDate', '>=', Timestamp.now())
  );
  return await getDocs(q);
};

// Lane management
export const getLanesCollection = (schoolId: string) =>
  getSchoolCollection(schoolId, 'lanes');

export const getTodaysLane = async (schoolId: string) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lanesCollection = getLanesCollection(schoolId);
  const q = query(lanesCollection, where('date', '==', today));
  return await getDocs(q);
};

export const createTodaysLane = async (schoolId: string, coneCount: number, timezone: string) => {
  const today = new Date().toISOString().split('T')[0];
  const lane: Omit<Lane, 'id'> = {
    date: today,
    coneCount,
    currentPointer: 1,
    timezone,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  return await addDoc(getLanesCollection(schoolId), lane);
};

// Dismissal management
export const getDismissalsCollection = (schoolId: string) =>
  getSchoolCollection(schoolId, 'dismissals');

export const addDismissal = async (schoolId: string, dismissal: Omit<Dismissal, 'id'>) => {
  return await addDoc(getDismissalsCollection(schoolId), dismissal);
};

export const getTodaysDismissals = async (schoolId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dismissalsCollection = getDismissalsCollection(schoolId);
  const q = query(
    dismissalsCollection,
    where('dismissedAt', '>=', Timestamp.fromDate(today)),
    where('dismissedAt', '<', Timestamp.fromDate(tomorrow)),
    orderBy('dismissedAt', 'desc')
  );
  return await getDocs(q);
};

// Real-time listeners
export const subscribeToDismissals = (schoolId: string, callback: (dismissals: Dismissal[]) => void) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dismissalsCollection = getDismissalsCollection(schoolId);
  const q = query(
    dismissalsCollection,
    where('dismissedAt', '>=', Timestamp.fromDate(today)),
    where('dismissedAt', '<', Timestamp.fromDate(tomorrow)),
    orderBy('dismissedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const dismissals: Dismissal[] = [];
    snapshot.forEach((doc) => {
      dismissals.push({ id: doc.id, ...doc.data() } as Dismissal);
    });
    callback(dismissals);
  });
};

// Utility functions
export const generateQRCode = (carNumber: string): string => {
  return `DISMISSAL_CAR_${carNumber}`;
};

export const parseQRCode = (qrText: string): { isValid: boolean; carNumber?: string } => {
  const prefix = 'DISMISSAL_CAR_';
  if (qrText.startsWith(prefix)) {
    return {
      isValid: true,
      carNumber: qrText.substring(prefix.length)
    };
  }
  return { isValid: false };
};