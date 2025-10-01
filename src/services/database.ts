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
import { SportEntry, PushUpEntry, ProteinEntry, WaterEntry, WeightEntry } from '../types';

// Sport Entries (Simple checkbox)
export const addSportEntry = async (userId: string) => {
  const docRef = await addDoc(collection(db, 'sportEntries'), {
    userId,
    date: Timestamp.fromDate(new Date()),
    completed: true,
  });
  return docRef.id;
};

export const getSportEntries = async (userId: string) => {
  const q = query(
    collection(db, 'sportEntries'),
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

// Push-up Entries
export const addPushUpEntry = async (userId: string, data: Omit<PushUpEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'pushUpEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getPushUpEntries = async (userId: string) => {
  const q = query(
    collection(db, 'pushUpEntries'),
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

// Protein Entries
export const addProteinEntry = async (userId: string, data: Omit<ProteinEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'proteinEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getProteinEntries = async (userId: string) => {
  const q = query(
    collection(db, 'proteinEntries'),
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

// Water Entries
export const addWaterEntry = async (userId: string, data: Omit<WaterEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'waterEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getWaterEntries = async (userId: string) => {
  const q = query(
    collection(db, 'waterEntries'),
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

// Weight Entries
export const addWeightEntry = async (userId: string, data: Omit<WeightEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'weightEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getWeightEntries = async (userId: string) => {
  const q = query(
    collection(db, 'weightEntries'),
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

// Backward compatibility - keep old function names but map to new ones
export const getNutritionEntries = getProteinEntries;
export const addNutritionEntry = addProteinEntry;

// Delete Entry
export const deleteEntry = async (collectionName: string, entryId: string) => {
  await deleteDoc(doc(db, collectionName, entryId));
};

// Update Push-up Entry
export const updatePushUpEntry = async (entryId: string, count: number) => {
  await updateDoc(doc(db, 'pushUpEntries', entryId), { count });
};

// Update Water Entry
export const updateWaterEntry = async (entryId: string, amount: number) => {
  await updateDoc(doc(db, 'waterEntries', entryId), { amount });
};

// Update Protein Entry
export const updateProteinEntry = async (entryId: string, grams: number) => {
  await updateDoc(doc(db, 'proteinEntries', entryId), { grams });
};

// Update Weight Entry
export const updateWeightEntry = async (entryId: string, data: { weight?: number; bodyFat?: number }) => {
  await updateDoc(doc(db, 'weightEntries', entryId), data);
};
