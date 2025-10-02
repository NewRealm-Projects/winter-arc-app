import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User, DailyTracking } from '../types';

// User operations
export async function saveUser(userId: string, userData: Omit<User, 'id'>) {
  try {
    const userRef = doc(db, 'users', userId);
    // Remove undefined fields to avoid Firestore error
    const cleanedData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    await setDoc(userRef, cleanedData);
    return { success: true };
  } catch (error) {
    console.error('Error saving user:', error);
    return { success: false, error };
  }
}

export async function getUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { success: true, data: { id: userId, ...userDoc.data() } as User };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error };
  }
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
}

// Tracking operations
export async function saveDailyTracking(userId: string, date: string, tracking: DailyTracking) {
  try {
    const trackingRef = doc(db, 'tracking', userId, 'days', date);
    await setDoc(trackingRef, tracking);
    return { success: true };
  } catch (error) {
    console.error('Error saving tracking:', error);
    return { success: false, error };
  }
}

export async function getDailyTracking(userId: string, date: string) {
  try {
    const trackingRef = doc(db, 'tracking', userId, 'days', date);
    const trackingDoc = await getDoc(trackingRef);

    if (trackingDoc.exists()) {
      return { success: true, data: trackingDoc.data() as DailyTracking };
    }
    return { success: false, error: 'Tracking not found' };
  } catch (error) {
    console.error('Error getting tracking:', error);
    return { success: false, error };
  }
}

export async function getTrackingRange(userId: string, startDate: string, endDate: string) {
  try {
    const trackingRef = collection(db, 'tracking', userId, 'days');
    const q = query(
      trackingRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    const tracking: Record<string, DailyTracking> = {};

    querySnapshot.forEach((doc) => {
      tracking[doc.id] = doc.data() as DailyTracking;
    });

    return { success: true, data: tracking };
  } catch (error) {
    console.error('Error getting tracking range:', error);
    return { success: false, error };
  }
}

// Group operations
export async function createGroup(groupCode: string, creatorId: string) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    await setDoc(groupRef, {
      name: groupCode,
      members: [creatorId],
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error };
  }
}

export async function joinGroup(groupCode: string, userId: string) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      const members = groupDoc.data().members || [];
      if (!members.includes(userId)) {
        members.push(userId);
        await setDoc(groupRef, { members }, { merge: true });
      }
      return { success: true };
    } else {
      // Group doesn't exist, create it
      return createGroup(groupCode, userId);
    }
  } catch (error) {
    console.error('Error joining group:', error);
    return { success: false, error };
  }
}

export async function getGroupMembers(groupCode: string) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      const memberIds = groupDoc.data().members || [];

      // Fetch all member user data
      const members = await Promise.all(
        memberIds.map(async (memberId: string) => {
          const result = await getUser(memberId);
          return result.success ? result.data : null;
        })
      );

      return { success: true, data: members.filter(Boolean) as User[] };
    }
    return { success: false, error: 'Group not found' };
  } catch (error) {
    console.error('Error getting group members:', error);
    return { success: false, error };
  }
}
