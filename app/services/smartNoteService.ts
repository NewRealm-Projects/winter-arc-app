import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { SmartNote, SmartNoteAttachment } from '../types/events';

const COLLECTION_KEY = 'smartNotes';

type AnyRecord = Record<string, unknown>;

type FetchOptions = {
  limit?: number;
  cursor?: number;
};

const FIRESTORE_INVALID_FIELD_CHARACTERS = ['~', '*', '/', '[', ']'];

function isValidKey(key: string): boolean {
  if (key.trim() === '') {
    return false;
  }

  if (key.startsWith('__')) {
    return false;
  }

  return !FIRESTORE_INVALID_FIELD_CHARACTERS.some((invalidChar) => key.includes(invalidChar));
}

function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (typeof value === 'object') {
    const sanitizedEntries = Object.entries(value as AnyRecord).reduce<AnyRecord>((acc, [key, entryValue]) => {
      if (entryValue === undefined) {
        return acc;
      }

      if (typeof key === 'string' && key.trim() !== '') {
        if (isValidKey(key)) { acc[key] = sanitizeForFirestore(entryValue); }
      }
      return acc;
    }, {});

    return sanitizedEntries as T;
  }

  return value;
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

let cachedDb: Firestore | null | undefined;
let cachedStorage: FirebaseStorage | null | undefined;

async function getFirestoreInstance(): Promise<Firestore | null> {
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  if (typeof window === 'undefined') {
    cachedDb = null;
    return cachedDb;
  }

  try {
    const module = await import('../firebase');
    cachedDb = module.db;
    return cachedDb;
  } catch (error) {
    console.warn('Firestore unavailable, skipping smart note persistence.', error);
    cachedDb = null;
    return cachedDb;
  }
}

async function getStorageInstance(): Promise<FirebaseStorage | null> {
  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  if (typeof window === 'undefined') {
    cachedStorage = null;
    return cachedStorage;
  }

  try {
    const module = await import('../firebase');
    cachedStorage = module.storage;
    return cachedStorage;
  } catch (error) {
    console.warn('Firebase storage unavailable, skipping attachment upload.', error);
    cachedStorage = null;
    return cachedStorage;
  }
}

async function ensureAttachmentUploaded(
  storage: FirebaseStorage,
  userId: string,
  noteId: string,
  attachment: SmartNoteAttachment
): Promise<SmartNoteAttachment> {
  if (!isDataUrl(attachment.url) && attachment.storagePath) {
    return attachment;
  }

  if (!isDataUrl(attachment.url) && !attachment.storagePath) {
    // Attachment is already remote but missing storage metadata
    return attachment;
  }

  const response = await fetch(attachment.url);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  const extension = mime.split('/')[1] || 'jpg';
  const storagePath = `smart-notes/${userId}/${noteId}/${attachment.id}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, {
    contentType: mime,
    cacheControl: 'public,max-age=31536000',
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    ...attachment,
    url: downloadURL,
    storagePath,
  };
}

export async function upsertSmartNote(userId: string, note: SmartNote): Promise<SmartNote> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return note;
  }

  let attachments = note.attachments;

  if (attachments && attachments.some((attachment) => attachment.url.startsWith('data:') || !attachment.storagePath)) {
    const storage = await getStorageInstance();
    if (!storage) {
      console.warn('Skipping smart note upload because storage is unavailable.');
      return note;
    }

    attachments = await Promise.all(
      attachments.map((attachment) => ensureAttachmentUploaded(storage, userId, note.id, attachment))
    );
  }

  const payload: SmartNote = {
    ...note,
    attachments,
  };

  const docRef = doc(firestore, 'users', userId, COLLECTION_KEY, note.id);
  await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });

  return payload;
}

export async function deleteSmartNote(userId: string, note: SmartNote): Promise<void> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return;
  }

  const docRef = doc(firestore, 'users', userId, COLLECTION_KEY, note.id);
  await deleteDoc(docRef);

  if (note.attachments && note.attachments.length > 0) {
    const storage = await getStorageInstance();
    if (!storage) {
      return;
    }

    await Promise.allSettled(
      note.attachments
        .filter((attachment) => Boolean(attachment.storagePath))
        .map((attachment) => deleteObject(ref(storage, attachment.storagePath)))
    );
  }
}

export async function fetchSmartNotes(userId: string, options: FetchOptions = {}): Promise<SmartNote[]> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return [];
  }

  const { limit: limitValue, cursor } = options;
  const collectionRef = collection(firestore, 'users', userId, COLLECTION_KEY);
  const constraints: QueryConstraint[] = [orderBy('ts', 'desc')];

  if (typeof cursor === 'number') {
    constraints.push(where('ts', '<', cursor));
  }

  if (typeof limitValue === 'number' && limitValue > 0) {
    constraints.push(limit(limitValue));
  }

  const snapshot = await getDocs(query(collectionRef, ...constraints));

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as SmartNote;
    return {
      ...data,
      id: docSnapshot.id,
    };
  });
}

export async function fetchAllSmartNotes(userId: string): Promise<SmartNote[]> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return [];
  }

  const collectionRef = collection(firestore, 'users', userId, COLLECTION_KEY);
  const snapshot = await getDocs(query(collectionRef, orderBy('ts', 'desc')));

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as SmartNote;
    return {
      ...data,
      id: docSnapshot.id,
    };
  });
}

