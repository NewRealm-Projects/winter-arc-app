import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const ensureDb = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Please set the required environment variables.');
  }
  return db;
};


import { SportEntry, PushUpEntry, ProteinEntry, WaterEntry, WeightEntry } from '../types';

/**
 * Maximum values for validation
 */
const MAX_PUSH_UPS = 1000;
const MAX_WATER_ML = 5000;
const MAX_PROTEIN_G = 500;
const MAX_WEIGHT_KG = 500;
const MAX_BODY_FAT_PCT = 50;
const MIN_BODY_FAT_PCT = 3;

// ============================================================================
// SPORT ENTRIES
// ============================================================================

/**
 * Marks sport as completed for today
 * @param userId - The user's Firebase UID
 * @returns Promise<string> - The document ID of the created entry
 * @throws Error if user is not authenticated or save fails
 */
export const addSportEntry = async (userId: string): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const docRef = await addDoc(collection(ensureDb(), 'sportEntries'), {
    userId,
    date: Timestamp.fromDate(new Date()),
    completed: true,
  });
  return docRef.id;
};

/**
 * Retrieves all sport entries for a user, sorted by date (newest first)
 * @param userId - The user's Firebase UID
 * @returns Promise<SportEntry[]> - Array of sport entries
 */
export const getSportEntries = async (userId: string): Promise<SportEntry[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const q = query(
    collection(ensureDb(), 'sportEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as SportEntry[];
};

// ============================================================================
// PUSH-UP ENTRIES
// ============================================================================

/**
 * Adds a new push-up entry
 * @param userId - The user's Firebase UID
 * @param data - Push-up entry data (count, date, optional notes)
 * @returns Promise<string> - The document ID of the created entry
 * @throws Error if validation fails or save fails
 */
export const addPushUpEntry = async (
  userId: string,
  data: Omit<PushUpEntry, 'id' | 'userId'>
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!data.count || data.count <= 0 || data.count > MAX_PUSH_UPS) {
    throw new Error(`Push-up count must be between 1 and ${MAX_PUSH_UPS}`);
  }

  const docRef = await addDoc(collection(ensureDb(), 'pushUpEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

/**
 * Retrieves all push-up entries for a user, sorted by date (newest first)
 * @param userId - The user's Firebase UID
 * @returns Promise<PushUpEntry[]> - Array of push-up entries
 */
export const getPushUpEntries = async (userId: string): Promise<PushUpEntry[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const q = query(
    collection(ensureDb(), 'pushUpEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as PushUpEntry[];
};

/**
 * Updates an existing push-up entry
 * @param entryId - The document ID of the entry to update
 * @param count - New push-up count
 * @throws Error if validation fails
 */
export const updatePushUpEntry = async (entryId: string, count: number): Promise<void> => {
  if (!entryId) {
    throw new Error('Entry ID is required');
  }

  if (count <= 0 || count > MAX_PUSH_UPS) {
    throw new Error(`Push-up count must be between 1 and ${MAX_PUSH_UPS}`);
  }

  await updateDoc(doc(ensureDb(), 'pushUpEntries', entryId), { count });
};

// ============================================================================
// PROTEIN ENTRIES
// ============================================================================

/**
 * Adds a new protein entry
 * @param userId - The user's Firebase UID
 * @param data - Protein entry data (grams, date, optional notes)
 * @returns Promise<string> - The document ID of the created entry
 * @throws Error if validation fails
 */
export const addProteinEntry = async (
  userId: string,
  data: Omit<ProteinEntry, 'id' | 'userId'>
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!data.grams || data.grams <= 0 || data.grams > MAX_PROTEIN_G) {
    throw new Error(`Protein amount must be between 1 and ${MAX_PROTEIN_G}g`);
  }

  const docRef = await addDoc(collection(ensureDb(), 'proteinEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

/**
 * Retrieves all protein entries for a user, sorted by date (newest first)
 * @param userId - The user's Firebase UID
 * @returns Promise<ProteinEntry[]> - Array of protein entries
 */
export const getProteinEntries = async (userId: string): Promise<ProteinEntry[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const q = query(
    collection(ensureDb(), 'proteinEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as ProteinEntry[];
};

/**
 * Updates an existing protein entry
 * @param entryId - The document ID of the entry to update
 * @param grams - New protein amount in grams
 * @throws Error if validation fails
 */
export const updateProteinEntry = async (entryId: string, grams: number): Promise<void> => {
  if (!entryId) {
    throw new Error('Entry ID is required');
  }

  if (grams <= 0 || grams > MAX_PROTEIN_G) {
    throw new Error(`Protein amount must be between 1 and ${MAX_PROTEIN_G}g`);
  }

  await updateDoc(doc(ensureDb(), 'proteinEntries', entryId), { grams });
};

// ============================================================================
// WATER ENTRIES
// ============================================================================

/**
 * Adds a new water entry
 * @param userId - The user's Firebase UID
 * @param data - Water entry data (amount in ml, date)
 * @returns Promise<string> - The document ID of the created entry
 * @throws Error if validation fails
 */
export const addWaterEntry = async (
  userId: string,
  data: Omit<WaterEntry, 'id' | 'userId'>
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!data.amount || data.amount <= 0 || data.amount > MAX_WATER_ML) {
    throw new Error(`Water amount must be between 1 and ${MAX_WATER_ML}ml`);
  }

  const docRef = await addDoc(collection(ensureDb(), 'waterEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

/**
 * Retrieves all water entries for a user, sorted by date (newest first)
 * @param userId - The user's Firebase UID
 * @returns Promise<WaterEntry[]> - Array of water entries
 */
export const getWaterEntries = async (userId: string): Promise<WaterEntry[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const q = query(
    collection(ensureDb(), 'waterEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as WaterEntry[];
};

/**
 * Updates an existing water entry
 * @param entryId - The document ID of the entry to update
 * @param amount - New water amount in ml
 * @throws Error if validation fails
 */
export const updateWaterEntry = async (entryId: string, amount: number): Promise<void> => {
  if (!entryId) {
    throw new Error('Entry ID is required');
  }

  if (amount <= 0 || amount > MAX_WATER_ML) {
    throw new Error(`Water amount must be between 1 and ${MAX_WATER_ML}ml`);
  }

  await updateDoc(doc(ensureDb(), 'waterEntries', entryId), { amount });
};

// ============================================================================
// WEIGHT ENTRIES
// ============================================================================

/**
 * Adds a new weight entry
 * @param userId - The user's Firebase UID
 * @param data - Weight entry data (weight in kg, optional body fat %, date)
 * @returns Promise<string> - The document ID of the created entry
 * @throws Error if validation fails
 */
export const addWeightEntry = async (
  userId: string,
  data: Omit<WeightEntry, 'id' | 'userId'>
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!data.weight || data.weight <= 0 || data.weight > MAX_WEIGHT_KG) {
    throw new Error(`Weight must be between 1 and ${MAX_WEIGHT_KG}kg`);
  }

  if (data.bodyFat !== undefined) {
    if (data.bodyFat < MIN_BODY_FAT_PCT || data.bodyFat > MAX_BODY_FAT_PCT) {
      throw new Error(`Body fat must be between ${MIN_BODY_FAT_PCT} and ${MAX_BODY_FAT_PCT}%`);
    }
  }

  const docRef = await addDoc(collection(ensureDb(), 'weightEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

/**
 * Retrieves weight entries for a user (last 30 entries), sorted by date (newest first)
 * @param userId - The user's Firebase UID
 * @returns Promise<WeightEntry[]> - Array of weight entries
 */
export const getWeightEntries = async (userId: string): Promise<WeightEntry[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const q = query(
    collection(ensureDb(), 'weightEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(30)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as WeightEntry[];
};

/**
 * Updates an existing weight entry
 * @param entryId - The document ID of the entry to update
 * @param data - Object containing weight and/or bodyFat to update
 * @throws Error if validation fails
 */
export const updateWeightEntry = async (
  entryId: string,
  data: { weight?: number; bodyFat?: number }
): Promise<void> => {
  if (!entryId) {
    throw new Error('Entry ID is required');
  }

  if (data.weight !== undefined) {
    if (data.weight <= 0 || data.weight > MAX_WEIGHT_KG) {
      throw new Error(`Weight must be between 1 and ${MAX_WEIGHT_KG}kg`);
    }
  }

  if (data.bodyFat !== undefined) {
    if (data.bodyFat < MIN_BODY_FAT_PCT || data.bodyFat > MAX_BODY_FAT_PCT) {
      throw new Error(`Body fat must be between ${MIN_BODY_FAT_PCT} and ${MAX_BODY_FAT_PCT}%`);
    }
  }

  await updateDoc(doc(ensureDb(), 'weightEntries', entryId), data);
};

// ============================================================================
// GENERIC DELETE
// ============================================================================

/**
 * Deletes an entry from any collection
 * @param collectionName - The name of the Firestore collection
 * @param entryId - The document ID to delete
 * @throws Error if deletion fails
 */
export const deleteEntry = async (collectionName: string, entryId: string): Promise<void> => {
  if (!collectionName || !entryId) {
    throw new Error('Collection name and entry ID are required');
  }

  await deleteDoc(doc(ensureDb(), collectionName, entryId));
};

const deleteCollectionEntries = async (collectionName: string, userId: string) => {
  const snapshot = await getDocs(query(collection(ensureDb(), collectionName), where('userId', '==', userId)));
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
};

export const deleteUserData = async (userId: string): Promise<void> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const collections = ['pushUpEntries', 'waterEntries', 'proteinEntries', 'sportEntries', 'weightEntries'];
  for (const name of collections) {
    await deleteCollectionEntries(name, userId);
  }

  await deleteDoc(doc(ensureDb(), 'users', userId));
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates BMI from weight and height
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @returns number - BMI value rounded to 1 decimal place
 */
export const calculateBMI = (weight: number, height: number): number => {
  if (weight <= 0 || height <= 0) {
    throw new Error('Weight and height must be positive numbers');
  }

  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters ** 2)) * 10) / 10;
};

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use getProteinEntries instead
 */
export const getNutritionEntries = getProteinEntries;

/**
 * @deprecated Use addProteinEntry instead
 */
export const addNutritionEntry = addProteinEntry;


