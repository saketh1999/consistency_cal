'use server';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  DocumentData,
  Firestore,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import type { AppData, DailyData, FitnessGoals } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
db = getFirestore(app);

const USER_PROFILE_COLLECTION = 'userProfiles';
const DAILY_ENTRIES_SUBCOLLECTION = 'dailyEntries';
const SETTINGS_SUBCOLLECTION = 'settings';
const FITNESS_GOALS_DOC = 'fitnessGoals';


// --- Daily Data ---
export async function saveDailyEntryForUser(userId: string, dateKey: string, data: DailyData): Promise<void> {
  try {
    const entryRef = doc(db, USER_PROFILE_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, dateKey);
    await setDoc(entryRef, data, { merge: true }); // merge:true to update existing fields or create if not exists
    console.log(`Daily entry for ${dateKey} saved for user ${userId}`);
  } catch (error) {
    console.error(`Error saving daily entry for ${userId} on ${dateKey} to Firestore:`, error);
    throw error; // Re-throw to allow higher-level error handling
  }
}

export async function loadDailyEntryForUser(userId: string, dateKey: string): Promise<DailyData | undefined> {
  try {
    const entryRef = doc(db, USER_PROFILE_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, dateKey);
    const docSnap = await getDoc(entryRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyData;
    }
    return undefined;
  } catch (error) {
    console.error(`Error loading daily entry for ${userId} on ${dateKey} from Firestore:`, error);
    throw error;
  }
}

export async function loadAllDailyEntriesForUser(userId: string): Promise<AppData> {
  try {
    const entriesCollectionRef = collection(db, USER_PROFILE_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION);
    const querySnapshot = await getDocs(entriesCollectionRef);
    const appData: AppData = {};
    querySnapshot.forEach((docSnap) => {
      appData[docSnap.id] = docSnap.data() as DailyData;
    });
    return appData;
  } catch (error) {
    console.error(`Error loading all daily entries for user ${userId} from Firestore:`, error);
    throw error;
  }
}

// --- Fitness Goals ---
export async function saveUserFitnessGoals(userId: string, goals: FitnessGoals): Promise<void> {
  try {
    const goalsRef = doc(db, USER_PROFILE_COLLECTION, userId, SETTINGS_SUBCOLLECTION, FITNESS_GOALS_DOC);
    await setDoc(goalsRef, goals, { merge: true });
    console.log(`Fitness goals saved for user ${userId}`);
  } catch (error) {
    console.error(`Error saving fitness goals for user ${userId} to Firestore:`, error);
    throw error;
  }
}

export async function loadUserFitnessGoals(userId: string): Promise<FitnessGoals | undefined> {
  try {
    const goalsRef = doc(db, USER_PROFILE_COLLECTION, userId, SETTINGS_SUBCOLLECTION, FITNESS_GOALS_DOC);
    const docSnap = await getDoc(goalsRef);
    if (docSnap.exists()) {
      return docSnap.data() as FitnessGoals;
    }
    return { goals: '' }; // Return default empty goals if not found
  } catch (error) {
    console.error(`Error loading fitness goals for user ${userId} from Firestore:`, error);
    throw error;
  }
}

// Example of how you might delete a daily entry if needed in the future
export async function deleteDailyEntryForUser(userId: string, dateKey: string): Promise<void> {
  try {
    const entryRef = doc(db, USER_PROFILE_COLLECTION, userId, DAILY_ENTRIES_SUBCOLLECTION, dateKey);
    await deleteDoc(entryRef);
    console.log(`Daily entry for ${dateKey} deleted for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting daily entry for ${userId} on ${dateKey} from Firestore:`, error);
    throw error;
  }
}

    