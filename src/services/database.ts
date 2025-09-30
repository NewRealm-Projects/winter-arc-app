import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';
import { SportEntry, PushUpEntry, NutritionEntry, WaterEntry } from '../types';

// Sport Entries
export const addSportEntry = async (userId: string, data: Omit<SportEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'sportEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getSportEntries = async (userId: string, startDate?: Date, endDate?: Date) => {
  let q = query(
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

// Nutrition Entries
export const addNutritionEntry = async (userId: string, data: Omit<NutritionEntry, 'id' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'nutritionEntries'), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
  });
  return docRef.id;
};

export const getNutritionEntries = async (userId: string) => {
  const q = query(
    collection(db, 'nutritionEntries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  })) as NutritionEntry[];
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

// Delete Entry
export const deleteEntry = async (collectionName: string, entryId: string) => {
  await deleteDoc(doc(db, collectionName, entryId));
};
