import { auth, db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

export type SnapshotErrorHandler = (error: FirestoreError) => void;

function assertUserId(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new Error('userId required');
  }
}

function logSubscription(path: string, userId?: string): void {
  // eslint-disable-next-line no-console
  console.debug('[Auth]', auth.currentUser?.uid ?? null);
  // eslint-disable-next-line no-console
  console.debug('[Subscribe]', path);
  if (userId) {
    // eslint-disable-next-line no-console
    console.debug('[FS]', { userId, path });
  }
}

function handleSnapshotError(path: string, error: FirestoreError, onError?: SnapshotErrorHandler): void {
  console.warn('[FirestoreError]', { code: error.code, message: error.message, path });
  onError?.(error);
}

function mapDocuments<T extends DocumentData>(docs: QueryDocumentSnapshot<T>[]): Array<T & { id: string }> {
  return docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
}

export function onUserTrackingEntriesSnapshot<T extends DocumentData>(
  userId: string,
  onNext: (entries: Array<T & { id: string }>) => void,
  onError?: SnapshotErrorHandler
): Unsubscribe {
  assertUserId(userId);
  const collectionRef = collection(db, 'tracking', userId, 'entries');
  const pathString = `tracking/${userId}/entries`;
  logSubscription(pathString, userId);

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      onNext(mapDocuments(snapshot.docs as QueryDocumentSnapshot<T>[]));
    },
    (error) => handleSnapshotError(pathString, error, onError)
  );
}

export async function getUserDoc<T extends DocumentData>(userId: string): Promise<DocumentSnapshot<T>> {
  assertUserId(userId);
  const docRef = doc(db, 'users', userId);
  const pathString = `users/${userId}`;
  logSubscription(pathString, userId);
  return getDoc(docRef) as Promise<DocumentSnapshot<T>>;
}

export function onSmartNotesSnapshot<T extends DocumentData>(
  userId: string,
  onNext: (notes: Array<T & { id: string }>) => void,
  onError?: SnapshotErrorHandler
): Unsubscribe {
  assertUserId(userId);
  const collectionRef = collection(db, 'users', userId, 'smartNotes');
  const pathString = `users/${userId}/smartNotes`;
  logSubscription(pathString, userId);

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      onNext(mapDocuments(snapshot.docs as QueryDocumentSnapshot<T>[]));
    },
    (error) => handleSnapshotError(pathString, error, onError)
  );
}

export function onGroupDocSnapshot<T extends DocumentData>(
  groupCode: string,
  onNext: (docData: (T & { id: string }) | null) => void,
  onError?: SnapshotErrorHandler
): Unsubscribe {
  if (!groupCode) {
    throw new Error('groupCode required');
  }

  const docRef = doc(db, 'groups', groupCode);
  const pathString = `groups/${groupCode}`;
  logSubscription(pathString);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onNext({ id: snapshot.id, ...(snapshot.data() as T) });
      } else {
        onNext(null);
      }
    },
    (error) => handleSnapshotError(pathString, error, onError)
  );
}
