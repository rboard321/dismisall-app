import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgenRmRMA2GI38BTCi9YSXw5HjrU5vfc0",
  authDomain: "dismissal-time-b4674.firebaseapp.com",
  projectId: "dismissal-time-b4674",
  storageBucket: "dismissal-time-b4674.firebasestorage.app",
  messagingSenderId: "83634669908",
  appId: "1:83634669908:web:b2824a55047500ed8f60c1",
  measurementId: "G-KCW1XYKZZ0"
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const db = getFirestore(app);

export { firebaseAuth as auth, db };
